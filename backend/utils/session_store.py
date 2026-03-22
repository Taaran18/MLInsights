"""
File-based session store.

Each session is persisted to  backend/uploads/<session_id>/
  data.parquet       – original DataFrame
  cleaned.parquet    – cleaned DataFrame (optional)
  meta.json          – filename, trained_models, target_col, feature_cols

This survives uvicorn --reload restarts and process crashes.
"""
import os
import json
import pandas as pd
from typing import Any, Optional

# Resolve the uploads directory — configurable via UPLOAD_DIR env var.
# Default: backend/uploads/ (local dev).
# On Render set UPLOAD_DIR=/tmp/mlinsights_uploads (ephemeral but writable).
_STORE_DIR = os.getenv("UPLOAD_DIR") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
)
os.makedirs(_STORE_DIR, exist_ok=True)

# Runtime cache so we don't re-read parquet on every call
_cache: dict[str, dict] = {}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _session_dir(session_id: str) -> str:
    return os.path.join(_STORE_DIR, session_id)


def _meta_path(session_id: str) -> str:
    return os.path.join(_session_dir(session_id), "meta.json")


def _data_path(session_id: str) -> str:
    return os.path.join(_session_dir(session_id), "data.parquet")


def _cleaned_path(session_id: str) -> str:
    return os.path.join(_session_dir(session_id), "cleaned.parquet")


def _write_meta(session_id: str, meta: dict):
    with open(_meta_path(session_id), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


def _read_meta(session_id: str) -> Optional[dict]:
    p = _meta_path(session_id)
    if not os.path.exists(p):
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_df(path: str) -> Optional[pd.DataFrame]:
    if not os.path.exists(path):
        return None
    return pd.read_parquet(path)


def _save_df(df: pd.DataFrame, path: str):
    # Convert object columns with mixed types to string to allow parquet write
    df = df.copy()
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).replace("nan", pd.NA)
    df.to_parquet(path, index=False)


# ── Public API ────────────────────────────────────────────────────────────────

def create_session(session_id: str, df: pd.DataFrame, filename: str):
    sid_dir = _session_dir(session_id)
    os.makedirs(sid_dir, exist_ok=True)

    _save_df(df, _data_path(session_id))
    meta = {
        "filename": filename,
        "has_cleaned": False,
        "trained_models": {},
        "target_col": None,
        "feature_cols": None,
    }
    _write_meta(session_id, meta)

    _cache[session_id] = {
        "df": df,
        "cleaned_df": None,
        "meta": meta,
    }


def get_session(session_id: str) -> Optional[dict]:
    """Return a dict with keys: filename, df, cleaned_df, trained_models, …"""
    # Try cache first
    if session_id in _cache:
        cached = _cache[session_id]
        meta = cached["meta"]
        return {
            "df": cached["df"],
            "cleaned_df": cached["cleaned_df"],
            "filename": meta["filename"],
            "trained_models": meta.get("trained_models", {}),
            "target_col": meta.get("target_col"),
            "feature_cols": meta.get("feature_cols"),
        }

    # Fall back to disk (after server restart)
    meta = _read_meta(session_id)
    if meta is None:
        return None

    df = _load_df(_data_path(session_id))
    if df is None:
        return None

    cleaned_df = _load_df(_cleaned_path(session_id)) if meta.get("has_cleaned") else None

    _cache[session_id] = {"df": df, "cleaned_df": cleaned_df, "meta": meta}

    return {
        "df": df,
        "cleaned_df": cleaned_df,
        "filename": meta["filename"],
        "trained_models": meta.get("trained_models", {}),
        "target_col": meta.get("target_col"),
        "feature_cols": meta.get("feature_cols"),
    }


def update_session(session_id: str, **kwargs):
    """Update session fields. Handles cleaned_df and trained_models specially."""
    if session_id not in _cache:
        # Load from disk first
        if get_session(session_id) is None:
            return

    cached = _cache[session_id]
    meta = cached["meta"]

    if "cleaned_df" in kwargs:
        cleaned_df = kwargs.pop("cleaned_df")
        cached["cleaned_df"] = cleaned_df
        if cleaned_df is not None:
            _save_df(cleaned_df, _cleaned_path(session_id))
            meta["has_cleaned"] = True
        else:
            meta["has_cleaned"] = False
            p = _cleaned_path(session_id)
            if os.path.exists(p):
                os.remove(p)

    if "trained_models" in kwargs:
        meta["trained_models"] = kwargs.pop("trained_models")

    for k, v in kwargs.items():
        meta[k] = v

    _write_meta(session_id, meta)


def get_active_df(session_id: str) -> Optional[pd.DataFrame]:
    session = get_session(session_id)
    if not session:
        return None
    return session["cleaned_df"] if session["cleaned_df"] is not None else session["df"]


def get_session_dir(session_id: str) -> str:
    """Public accessor for the session's storage directory."""
    return _session_dir(session_id)


def get_meta_path(session_id: str) -> str:
    """Public accessor for the session's meta.json path."""
    return _meta_path(session_id)


def delete_session(session_id: str):
    import shutil
    _cache.pop(session_id, None)
    sid_dir = _session_dir(session_id)
    if os.path.exists(sid_dir):
        shutil.rmtree(sid_dir)
