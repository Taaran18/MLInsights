from fastapi import APIRouter, HTTPException
from utils.session_store import get_session, get_active_df
from utils.data_utils import (
    get_basic_info, get_head, get_tail, get_dtypes,
    get_describe, get_missing_info, get_value_counts, get_correlation, safe_json
)

router = APIRouter()


def _require_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found. Please upload a dataset first.")
    return session


@router.get("/{session_id}/overview")
def overview(session_id: str):
    session = _require_session(session_id)
    df = get_active_df(session_id)
    basic = get_basic_info(df, session["filename"])
    missing = get_missing_info(df)
    return safe_json({
        **basic,
        "is_cleaned": session["cleaned_df"] is not None,
        "total_missing": missing["total_missing"],
        "total_missing_percentage": missing["total_missing_percentage"],
    })


@router.get("/{session_id}/head")
def head(session_id: str, n: int = 10):
    _require_session(session_id)
    df = get_active_df(session_id)
    return safe_json({"data": get_head(df, n), "columns": df.columns.tolist()})


@router.get("/{session_id}/tail")
def tail(session_id: str, n: int = 10):
    _require_session(session_id)
    df = get_active_df(session_id)
    return safe_json({"data": get_tail(df, n), "columns": df.columns.tolist()})


@router.get("/{session_id}/dtypes")
def dtypes(session_id: str):
    _require_session(session_id)
    df = get_active_df(session_id)
    return {"dtypes": get_dtypes(df)}


@router.get("/{session_id}/describe")
def describe(session_id: str):
    _require_session(session_id)
    df = get_active_df(session_id)
    return safe_json({"describe": get_describe(df)})


@router.get("/{session_id}/missing")
def missing(session_id: str):
    _require_session(session_id)
    df = get_active_df(session_id)
    return safe_json(get_missing_info(df))


@router.get("/{session_id}/correlation")
def correlation(session_id: str):
    _require_session(session_id)
    df = get_active_df(session_id)
    return safe_json({"correlation": get_correlation(df)})


@router.get("/{session_id}/value_counts/{column}")
def value_counts(session_id: str, column: str, top_n: int = 20):
    _require_session(session_id)
    df = get_active_df(session_id)
    if column not in df.columns:
        raise HTTPException(404, f"Column '{column}' not found.")
    return safe_json({"column": column, "counts": get_value_counts(df, column, top_n)})
