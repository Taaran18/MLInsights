import io
import logging
import os
import re
import uuid
import zipfile

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from utils.data_utils import get_basic_info, get_missing_info
from utils.session_store import (
    create_session,
    prune_expired_sessions,
    session_summary,
)

router = APIRouter()
logger = logging.getLogger("mlinsights.upload")

ALLOWED_EXTS = {".csv", ".xlsx", ".xls"}
CHUNK_SIZE = 1024 * 1024


def _max_upload_mb() -> float:
    try:
        return max(1.0, float(os.getenv("MAX_UPLOAD_MB", "50")))
    except ValueError:
        return 50.0


def _clean_filename(raw: str) -> tuple[str, str]:
    base = os.path.basename((raw or "").replace("\\", "/"))
    base = re.sub(r"[\x00-\x1f\x7f\"<>]", "", base).strip()
    stem, ext = os.path.splitext(base)
    ext = ext.lower()
    stem = stem[:100] or "dataset"
    return f"{stem}{ext}", ext


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    seen: dict[str, int] = {}
    names = []
    for index, col in enumerate(df.columns):
        name = str(col).strip() or f"column_{index + 1}"
        if name in seen:
            seen[name] += 1
            name = f"{name}_{seen[name]}"
        else:
            seen[name] = 0
        names.append(name)
    df.columns = names
    return df


def _detect_separator(sample: str) -> str:
    first = sample.splitlines()[0] if sample else ""
    if "," in first:
        return ","
    for candidate in (";", "\t", "|"):
        if candidate in first:
            return candidate
    return ","


def _read_csv(contents: bytes) -> pd.DataFrame:
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        sample = contents[:65536].decode(encoding, errors="ignore")
        try:
            return pd.read_csv(
                io.BytesIO(contents),
                encoding=encoding,
                sep=_detect_separator(sample),
                low_memory=False,
            )
        except UnicodeDecodeError:
            continue
    raise HTTPException(
        400, "We couldn't detect this file's text encoding. Save it as UTF-8 CSV and try again."
    )


def _read_dataframe(contents: bytes, ext: str) -> pd.DataFrame:
    try:
        if ext == ".csv":
            return _read_csv(contents)
        return pd.read_excel(io.BytesIO(contents))
    except HTTPException:
        raise
    except pd.errors.EmptyDataError:
        raise HTTPException(400, "This file is empty. Add some data and upload it again.")
    except pd.errors.ParserError:
        raise HTTPException(
            400,
            "We couldn't read this file as a table. Check that every row has the same number of columns.",
        )
    except (zipfile.BadZipFile, ValueError, KeyError):
        raise HTTPException(
            400,
            "We couldn't open this spreadsheet. Check that it isn't password-protected or corrupted.",
        )
    except Exception:
        logger.exception("dataset_parse_failed ext=%s", ext)
        raise HTTPException(
            400, "We couldn't read this file. Check that it's a valid CSV or Excel file."
        )


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    filename, ext = _clean_filename(file.filename or "")
    if ext not in ALLOWED_EXTS:
        kind = f"“{ext}” files aren't supported." if ext else "This file has no extension."
        raise HTTPException(400, f"{kind} Upload a .csv, .xlsx, or .xls file.")

    limit_mb = _max_upload_mb()
    limit_bytes = int(limit_mb * 1024 * 1024)
    buffer = bytearray()
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        buffer.extend(chunk)
        if len(buffer) > limit_bytes:
            raise HTTPException(
                413,
                f"This file is larger than {limit_mb:g} MB. Remove columns or rows you don't need and try again.",
            )

    if not buffer:
        raise HTTPException(400, "This file is empty. Add some data and upload it again.")

    df = _read_dataframe(bytes(buffer), ext)
    if df.empty or df.shape[1] == 0:
        raise HTTPException(400, "This file doesn't contain any rows of data.")
    df = _normalize_columns(df)

    prune_expired_sessions()
    session_id = str(uuid.uuid4())
    create_session(session_id, df, filename)
    summary = session_summary(session_id) or {}

    basic = get_basic_info(df, filename)
    missing = get_missing_info(df)

    return {
        "session_id": session_id,
        "filename": filename,
        "rows": basic["rows"],
        "columns": basic["columns"],
        "has_missing": missing["total_missing"] > 0,
        "total_missing": missing["total_missing"],
        "created_at": summary.get("created_at"),
        "expires_at": summary.get("expires_at"),
    }
