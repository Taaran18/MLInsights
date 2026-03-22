from typing import Any
from fastapi import APIRouter, HTTPException
from utils.session_store import get_session, get_active_df
from utils.ml_models import get_model_catalog, recommend_models
from utils.data_utils import infer_task_type

router = APIRouter()

# Keywords that strongly suggest a column is a target/label
_TARGET_KEYWORDS = [
    "target", "label", "class", "output", "result", "fraud", "churn",
    "survived", "survival", "default", "approved", "status", "outcome",
    "response", "flag", "converted", "cancelled", "purchased", "clicked",
    "charged", "diagnosis", "disease", "spam", "sentiment", "category",
    "prediction", "score", "grade", "risk", "type",
]


@router.get("/catalog")
def catalog():
    """Return all available models grouped by task."""
    return get_model_catalog()


@router.get("/{session_id}/suggest_target")
def suggest_target(session_id: str, task: str = "classification"):
    """Analyze dataset columns and return ranked suggestions for the target column."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    df = get_active_df(session_id)
    n_rows = len(df)
    suggestions: list = []

    for idx, col in enumerate(df.columns):
        score = 0
        reasons: list[str] = []
        col_lower = col.lower().replace(" ", "_").replace("-", "_")
        n_unique = int(df[col].nunique())
        dtype = str(df[col].dtype)

        # --- Name-based scoring ---
        if col_lower in _TARGET_KEYWORDS:
            score += 5
            reasons.append("Column name is a classic target/label name")
        elif any(kw in col_lower for kw in _TARGET_KEYWORDS):
            score += 3
            reasons.append("Column name contains a target keyword")

        # Last column is a very common ML convention for labels
        if idx == len(df.columns) - 1:
            score += 2
            reasons.append("Last column — common convention for labels")

        # --- Value-based scoring per task ---
        if task == "classification":
            if n_unique == 2:
                score += 4
                try:
                    vals = sorted([str(v) for v in df[col].dropna().unique()])
                    reasons.append(f"Binary column (values: {vals[0]}, {vals[1]})")
                except Exception:
                    reasons.append("Binary column (2 unique values)")
            elif 2 < n_unique <= 15:
                score += 2
                reasons.append(f"Low cardinality — {n_unique} unique values (good for multi-class)")
            elif n_unique > n_rows * 0.5:
                score -= 4  # too many unique values — likely an ID or free text

        elif task == "regression":
            if dtype in ("float64", "float32", "int64", "int32") and n_unique > 20:
                score += 3
                reasons.append("Continuous numeric column — ideal regression target")
            elif n_unique <= 5:
                score -= 3  # looks categorical, not a regression target

        # Exclude obvious ID columns regardless of task
        if col_lower in ("id", "index", "row_id", "uuid") or col_lower.endswith("_id"):
            score -= 10

        if score > 0:
            suggestions.append({
                "column": col,
                "score": score,
                "reasons": reasons,
                "n_unique": n_unique,
                "dtype": dtype,
            })

    suggestions.sort(key=lambda x: x["score"], reverse=True)
    top: list = []
    for i in range(min(5, len(suggestions))):
        top.append(suggestions[i])
    return {"suggestions": top}


@router.get("/{session_id}/recommend")
def recommend(session_id: str, target_col: str = None):
    """Recommend models based on dataset characteristics."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    df = get_active_df(session_id)
    n_rows, n_cols = df.shape

    if target_col:
        task = infer_task_type(df, target_col)
    else:
        task = "clustering"

    recommendations = recommend_models(task, n_rows, n_cols)
    return {
        "task": task,
        "n_rows": n_rows,
        "n_cols": n_cols,
        "target_col": target_col,
        "recommendations": recommendations,
    }
