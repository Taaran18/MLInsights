from fastapi import APIRouter, HTTPException, Query

from routers.common import active_df, require_session
from utils.data_utils import (
    get_basic_info,
    get_column_profiles,
    get_correlation,
    get_describe,
    get_dtypes,
    get_head,
    get_missing_info,
    get_tail,
    get_value_counts,
    safe_json,
)

router = APIRouter()


@router.get("/{session_id}/overview")
def overview(session_id: str):
    session = require_session(session_id)
    df = active_df(session)
    basic = get_basic_info(df, session["filename"])
    missing = get_missing_info(df)
    return safe_json(
        {
            **basic,
            "is_cleaned": session["cleaned_df"] is not None,
            "total_missing": missing["total_missing"],
            "total_missing_percentage": missing["total_missing_percentage"],
            "trained_models": len(session["trained_models"]),
        }
    )


@router.get("/{session_id}/profile")
def profile(session_id: str):
    df = active_df(require_session(session_id))
    return safe_json(get_column_profiles(df))


@router.get("/{session_id}/head")
def head(session_id: str, n: int = Query(10, ge=1, le=100)):
    df = active_df(require_session(session_id))
    return safe_json({"data": get_head(df, n), "columns": df.columns.tolist()})


@router.get("/{session_id}/tail")
def tail(session_id: str, n: int = Query(10, ge=1, le=100)):
    df = active_df(require_session(session_id))
    return safe_json({"data": get_tail(df, n), "columns": df.columns.tolist()})


@router.get("/{session_id}/dtypes")
def dtypes(session_id: str):
    df = active_df(require_session(session_id))
    return {"dtypes": get_dtypes(df)}


@router.get("/{session_id}/describe")
def describe(session_id: str):
    df = active_df(require_session(session_id))
    return safe_json({"describe": get_describe(df)})


@router.get("/{session_id}/missing")
def missing(session_id: str):
    df = active_df(require_session(session_id))
    return safe_json(get_missing_info(df))


@router.get("/{session_id}/correlation")
def correlation(session_id: str):
    df = active_df(require_session(session_id))
    return safe_json({"correlation": get_correlation(df)})


def _value_counts(session_id: str, column: str, top_n: int):
    df = active_df(require_session(session_id))
    if column not in df.columns:
        raise HTTPException(404, f"Column “{column}” wasn't found in this dataset.")
    return safe_json(
        {
            "column": column,
            "unique": int(df[column].nunique(dropna=True)),
            "missing": int(df[column].isna().sum()),
            "counts": get_value_counts(df, column, top_n),
        }
    )


@router.get("/{session_id}/value_counts")
def value_counts_query(
    session_id: str,
    column: str = Query(..., min_length=1),
    top_n: int = Query(20, ge=1, le=100),
):
    return _value_counts(session_id, column, top_n)


@router.get("/{session_id}/value_counts/{column}")
def value_counts(session_id: str, column: str, top_n: int = Query(20, ge=1, le=100)):
    return _value_counts(session_id, column, top_n)
