import json
import os
import re
import shutil
import threading
import time
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _resolve_store_dir() -> str:
    explicit = os.getenv("UPLOAD_DIR", "").strip()
    if explicit:
        return explicit
    volume = os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "").strip()
    if volume:
        return os.path.join(volume, "sessions")
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


_STORE_DIR = _resolve_store_dir()
os.makedirs(_STORE_DIR, exist_ok=True)

SESSION_TTL_SECONDS = max(60, int(_env_float("SESSION_TTL_HOURS", 24) * 3600))

_SESSION_ID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)

MAX_CACHED_SESSIONS = max(1, int(_env_float("MAX_CACHED_SESSIONS", 8)))

_cache: "OrderedDict[str, dict]" = OrderedDict()
_lock = threading.RLock()


def _remember(session_id: str, entry: dict):
    _cache[session_id] = entry
    _cache.move_to_end(session_id)
    while len(_cache) > MAX_CACHED_SESSIONS:
        _cache.popitem(last=False)


def is_valid_session_id(session_id: Any) -> bool:
    return isinstance(session_id, str) and bool(_SESSION_ID_RE.match(session_id))


def _session_dir(session_id: str) -> str:
    return os.path.join(_STORE_DIR, session_id)


def _meta_path(session_id: str) -> str:
    return os.path.join(_session_dir(session_id), "meta.json")


def _data_path(session_id: str) -> str:
    return os.path.join(_session_dir(session_id), "data.parquet")


def _cleaned_path(session_id: str) -> str:
    return os.path.join(_session_dir(session_id), "cleaned.parquet")


def _write_meta(session_id: str, meta: dict):
    path = _meta_path(session_id)
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    os.replace(tmp_path, path)


def _read_meta(session_id: str) -> Optional[dict]:
    path = _meta_path(session_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None


def _load_df(path: str) -> Optional[pd.DataFrame]:
    if not os.path.exists(path):
        return None
    return pd.read_parquet(path)


def _save_df(df: pd.DataFrame, path: str):
    df = df.copy()
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).replace("nan", pd.NA)
    tmp_path = f"{path}.tmp"
    df.to_parquet(tmp_path, index=False)
    os.replace(tmp_path, path)


def _created_at(session_id: str, meta: Optional[dict]) -> float:
    if meta and isinstance(meta.get("created_at"), (int, float)):
        return float(meta["created_at"])
    try:
        return os.path.getmtime(_session_dir(session_id))
    except OSError:
        return time.time()


def _is_expired(session_id: str, meta: Optional[dict]) -> bool:
    return time.time() - _created_at(session_id, meta) > SESSION_TTL_SECONDS


def _iso(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def _delete_session_locked(session_id: str) -> bool:
    _cache.pop(session_id, None)
    session_dir = _session_dir(session_id)
    if os.path.isdir(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
        return True
    return False


def _load_into_cache(session_id: str) -> Optional[dict]:
    cached = _cache.get(session_id)
    if cached is not None:
        _cache.move_to_end(session_id)
        return cached
    meta = _read_meta(session_id)
    if meta is None:
        return None
    df = _load_df(_data_path(session_id))
    if df is None:
        return None
    cleaned_df = _load_df(_cleaned_path(session_id)) if meta.get("has_cleaned") else None
    cached = {"df": df, "cleaned_df": cleaned_df, "meta": meta}
    _remember(session_id, cached)
    return cached


def create_session(session_id: str, df: pd.DataFrame, filename: str) -> dict:
    with _lock:
        os.makedirs(_session_dir(session_id), exist_ok=True)
        _save_df(df, _data_path(session_id))
        meta = {
            "filename": filename,
            "created_at": time.time(),
            "has_cleaned": False,
            "trained_models": {},
            "target_col": None,
            "feature_cols": None,
        }
        _write_meta(session_id, meta)
        _remember(session_id, {"df": df, "cleaned_df": None, "meta": meta})
        return meta


def get_session(session_id: str) -> Optional[dict]:
    if not is_valid_session_id(session_id):
        return None
    with _lock:
        cached = _load_into_cache(session_id)
        if cached is None:
            return None
        meta = cached["meta"]
        if _is_expired(session_id, meta):
            _delete_session_locked(session_id)
            return None
        created = _created_at(session_id, meta)
        return {
            "df": cached["df"],
            "cleaned_df": cached["cleaned_df"],
            "filename": meta["filename"],
            "trained_models": dict(meta.get("trained_models", {})),
            "target_col": meta.get("target_col"),
            "feature_cols": meta.get("feature_cols"),
            "created_at": created,
            "expires_at": created + SESSION_TTL_SECONDS,
        }


def update_session(session_id: str, **kwargs):
    with _lock:
        cached = _load_into_cache(session_id) if is_valid_session_id(session_id) else None
        if cached is None:
            return
        meta = cached["meta"]

        if "cleaned_df" in kwargs:
            cleaned_df = kwargs.pop("cleaned_df")
            cached["cleaned_df"] = cleaned_df
            if cleaned_df is not None:
                _save_df(cleaned_df, _cleaned_path(session_id))
                meta["has_cleaned"] = True
            else:
                meta["has_cleaned"] = False
                path = _cleaned_path(session_id)
                if os.path.exists(path):
                    os.remove(path)

        for key, value in kwargs.items():
            meta[key] = value

        _write_meta(session_id, meta)


def set_trained_model(session_id: str, model_key: str, info: dict):
    with _lock:
        cached = _load_into_cache(session_id) if is_valid_session_id(session_id) else None
        if cached is None:
            return
        meta = cached["meta"]
        trained = dict(meta.get("trained_models", {}))
        trained[model_key] = info
        meta["trained_models"] = trained
        _write_meta(session_id, meta)


def remove_trained_model(session_id: str, model_key: str) -> bool:
    with _lock:
        cached = _load_into_cache(session_id) if is_valid_session_id(session_id) else None
        if cached is None:
            return False
        meta = cached["meta"]
        trained = dict(meta.get("trained_models", {}))
        existed = trained.pop(model_key, None) is not None
        meta["trained_models"] = trained
        _write_meta(session_id, meta)
        pkl_path = os.path.join(_session_dir(session_id), f"{model_key}.pkl")
        if existed and os.path.exists(pkl_path):
            os.remove(pkl_path)
        return existed


def get_active_df(session_id: str) -> Optional[pd.DataFrame]:
    session = get_session(session_id)
    if not session:
        return None
    return session["cleaned_df"] if session["cleaned_df"] is not None else session["df"]


def get_session_dir(session_id: str) -> str:
    return _session_dir(session_id)


def get_meta_path(session_id: str) -> str:
    return _meta_path(session_id)


def session_summary(session_id: str) -> Optional[dict]:
    session = get_session(session_id)
    if session is None:
        return None
    df = session["cleaned_df"] if session["cleaned_df"] is not None else session["df"]
    return {
        "session_id": session_id,
        "filename": session["filename"],
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "is_cleaned": session["cleaned_df"] is not None,
        "trained_models": len(session["trained_models"]),
        "created_at": _iso(session["created_at"]),
        "expires_at": _iso(session["expires_at"]),
    }


def delete_session(session_id: str) -> bool:
    if not is_valid_session_id(session_id):
        return False
    with _lock:
        return _delete_session_locked(session_id)


def store_dir() -> str:
    return _STORE_DIR


def prune_expired_sessions() -> int:
    try:
        entries = os.listdir(_STORE_DIR)
    except FileNotFoundError:
        return 0
    removed = 0
    for name in entries:
        if not is_valid_session_id(name) or not os.path.isdir(_session_dir(name)):
            continue
        with _lock:
            if _is_expired(name, _read_meta(name)) and _delete_session_locked(name):
                removed += 1
    return removed
