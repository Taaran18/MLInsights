import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, insights, cleaning, models, training, report

app = FastAPI(title="MLInsights API", version="1.0.0")

# Explicit origins from env var (comma-separated)
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Also allow any Vercel preview/production URL — catches env var mismatches
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(upload.router,   prefix="/api/upload",   tags=["Upload"])
app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])
app.include_router(cleaning.router, prefix="/api/cleaning", tags=["Cleaning"])
app.include_router(models.router,   prefix="/api/models",   tags=["Models"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])
app.include_router(report.router,   prefix="/api/report",   tags=["Report"])


@app.get("/")
def root():
    return {"message": "MLInsights API is running"}
