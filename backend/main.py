import asyncio
import logging
import os
import re
import threading
import time
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import cleaning, insights, models, report, sessions, training, upload
from utils.session_store import SESSION_TTL_SECONDS, prune_expired_sessions, store_dir

APP_VERSION = "2.0.0"
PRUNE_INTERVAL_SECONDS = 3600
REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("mlinsights")

_last_prune = 0.0
_prune_lock = threading.Lock()


def _env_list(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def _prune(reason: str):
    global _last_prune
    if not _prune_lock.acquire(blocking=False):
        return
    try:
        _last_prune = time.monotonic()
        removed = prune_expired_sessions()
        if removed:
            logger.info("sessions_pruned reason=%s count=%s", reason, removed)
    except Exception:
        logger.exception("sessions_prune_failed reason=%s", reason)
    finally:
        _prune_lock.release()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("startup version=%s store=%s", APP_VERSION, store_dir())
    await asyncio.to_thread(_prune, "startup")
    yield


app = FastAPI(title="MLInsights API", version=APP_VERSION, lifespan=lifespan)


@app.middleware("http")
async def request_context(request: Request, call_next):
    incoming = request.headers.get("X-Request-ID", "")
    request_id = incoming if REQUEST_ID_RE.match(incoming) else uuid.uuid4().hex
    started = time.perf_counter()
    if time.monotonic() - _last_prune > PRUNE_INTERVAL_SECONDS:
        await asyncio.to_thread(_prune, "request")
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request_failed request_id=%s method=%s path=%s",
            request_id,
            request.method,
            request.url.path,
        )
        response = JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong on our side. Please try again in a moment."},
        )
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request request_id=%s method=%s path=%s status=%s duration_ms=%.0f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        (time.perf_counter() - started) * 1000,
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_list("ALLOWED_ORIGINS", "http://localhost:3000"),
    allow_origin_regex=os.getenv("ALLOWED_ORIGIN_REGEX") or None,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Request-ID", "X-Error-Code"],
    max_age=600,
)

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])
app.include_router(cleaning.router, prefix="/api/cleaning", tags=["Cleaning"])
app.include_router(models.router, prefix="/api/models", tags=["Models"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])
app.include_router(report.router, prefix="/api/report", tags=["Report"])


@app.get("/")
def root():
    return {"message": "MLInsights API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": APP_VERSION,
        "session_ttl_hours": round(SESSION_TTL_SECONDS / 3600, 2),
    }
