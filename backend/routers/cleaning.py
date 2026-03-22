from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.session_store import get_session, get_active_df, update_session
from utils.data_utils import clean_dataset, get_basic_info, get_missing_info, safe_json

router = APIRouter()


class CleanOptions(BaseModel):
    drop_duplicates: bool = True
    fill_numeric: Optional[str] = "mean"       # "mean" | "median" | "zero" | None
    fill_categorical: Optional[str] = "mode"   # "mode" | "unknown" | None
    drop_high_missing_cols: Optional[float] = None   # percentage threshold
    drop_high_missing_rows: Optional[float] = None   # percentage threshold
    normalize_empty_strings: bool = True


@router.post("/{session_id}/clean")
def clean(session_id: str, options: CleanOptions):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    df = session["df"]  # Always clean from original
    cleaned = clean_dataset(df, options.model_dump())
    update_session(session_id, cleaned_df=cleaned)

    before_basic = get_basic_info(df, session["filename"])
    after_basic = get_basic_info(cleaned, session["filename"])
    after_missing = get_missing_info(cleaned)

    return safe_json({
        "message": "Dataset cleaned successfully.",
        "before": {
            "rows": before_basic["rows"],
            "columns": before_basic["columns"],
            "missing": get_missing_info(df)["total_missing"],
        },
        "after": {
            "rows": after_basic["rows"],
            "columns": after_basic["columns"],
            "missing": after_missing["total_missing"],
        },
    })


@router.post("/{session_id}/reset")
def reset_cleaning(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    update_session(session_id, cleaned_df=None)
    return {"message": "Reverted to original dataset."}


@router.get("/{session_id}/preview_clean")
def preview_clean(session_id: str, drop_duplicates: bool = True,
                  fill_numeric: Optional[str] = "mean",
                  fill_categorical: Optional[str] = "mode",
                  drop_high_missing_cols: Optional[float] = None,
                  drop_high_missing_rows: Optional[float] = None):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    df = session["df"]
    options = {
        "drop_duplicates": drop_duplicates,
        "fill_numeric": fill_numeric,
        "fill_categorical": fill_categorical,
        "drop_high_missing_cols": drop_high_missing_cols,
        "drop_high_missing_rows": drop_high_missing_rows,
        "normalize_empty_strings": True,
    }
    cleaned = clean_dataset(df, options)
    return safe_json({
        "before_rows": len(df),
        "after_rows": len(cleaned),
        "before_missing": get_missing_info(df)["total_missing"],
        "after_missing": get_missing_info(cleaned)["total_missing"],
        "dropped_rows": len(df) - len(cleaned),
    })
