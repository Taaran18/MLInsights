from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from routers.common import require_session
from utils.data_utils import clean_dataset, get_missing_info, safe_json
from utils.session_store import update_session

router = APIRouter()


class CleanOptions(BaseModel):
    drop_duplicates: bool = True
    fill_numeric: Optional[Literal["mean", "median", "zero"]] = "mean"
    fill_categorical: Optional[Literal["mode", "unknown"]] = "mode"
    drop_high_missing_cols: Optional[float] = Field(None, ge=0, le=100)
    drop_high_missing_rows: Optional[float] = Field(None, ge=0, le=100)
    normalize_empty_strings: bool = True


def _impact(original, cleaned) -> dict:
    return {
        "before": {
            "rows": int(original.shape[0]),
            "columns": int(original.shape[1]),
            "missing": get_missing_info(original)["total_missing"],
        },
        "after": {
            "rows": int(cleaned.shape[0]),
            "columns": int(cleaned.shape[1]),
            "missing": get_missing_info(cleaned)["total_missing"],
        },
        "dropped_rows": int(original.shape[0] - cleaned.shape[0]),
        "dropped_columns": [str(c) for c in original.columns if c not in cleaned.columns],
    }


@router.post("/{session_id}/preview")
def preview(session_id: str, options: CleanOptions):
    session = require_session(session_id)
    original = session["df"]
    cleaned = clean_dataset(original, options.model_dump())
    return safe_json(_impact(original, cleaned))


@router.post("/{session_id}/clean")
def clean(session_id: str, options: CleanOptions):
    session = require_session(session_id)
    original = session["df"]
    cleaned = clean_dataset(original, options.model_dump())
    update_session(session_id, cleaned_df=cleaned)
    return safe_json({"message": "Dataset cleaned.", **_impact(original, cleaned)})


@router.post("/{session_id}/reset")
def reset_cleaning(session_id: str):
    require_session(session_id)
    update_session(session_id, cleaned_df=None)
    return {"message": "Reverted to the original dataset."}
