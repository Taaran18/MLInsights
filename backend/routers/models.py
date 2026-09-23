from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from routers.common import TaskType, active_df, require_session
from utils.data_utils import infer_task_type

router = APIRouter()

_TARGET_KEYWORDS = [
    "target", "label", "class", "output", "result", "fraud", "churn",
    "survived", "survival", "default", "approved", "status", "outcome",
    "response", "flag", "converted", "cancelled", "purchased", "clicked",
    "charged", "diagnosis", "disease", "spam", "sentiment", "category",
    "prediction", "score", "grade", "risk", "type", "species", "price",
]

_ID_NAMES = ("id", "index", "row_id", "uuid", "unnamed: 0")


def _looks_like_id(col_lower: str) -> bool:
    return col_lower in _ID_NAMES or col_lower.endswith("_id")


def _registry():
    from utils import ml_models

    return ml_models


@router.get("/catalog")
def catalog():
    return _registry().get_model_catalog()


@router.get("/{session_id}/suggest_target")
def suggest_target(session_id: str, task: TaskType = "classification"):
    df = active_df(require_session(session_id))
    n_rows = len(df)
    suggestions: list = []

    for idx, col in enumerate(df.columns):
        score = 0
        reasons: list[str] = []
        col_lower = str(col).lower().replace(" ", "_").replace("-", "_")
        n_unique = int(df[col].nunique())
        dtype = str(df[col].dtype)

        if col_lower in _TARGET_KEYWORDS:
            score += 5
            reasons.append("Column name is a common target name")
        elif any(keyword in col_lower for keyword in _TARGET_KEYWORDS):
            score += 3
            reasons.append("Column name contains a common target keyword")

        if idx == len(df.columns) - 1:
            score += 2
            reasons.append("Last column, a common place for labels")

        if task == "classification":
            if n_unique == 2:
                score += 4
                try:
                    values = sorted(str(v) for v in df[col].dropna().unique())
                    reasons.append(f"Two distinct values ({values[0]}, {values[1]})")
                except Exception:
                    reasons.append("Two distinct values")
            elif 2 < n_unique <= 15:
                score += 2
                reasons.append(f"{n_unique} distinct values, good for multi-class")
            elif n_unique > n_rows * 0.5:
                score -= 4
        elif task == "regression":
            if dtype in ("float64", "float32", "int64", "int32") and n_unique > 20:
                score += 3
                reasons.append("Continuous numbers, ideal for regression")
            elif n_unique <= 5:
                score -= 3

        if _looks_like_id(col_lower):
            score -= 10

        if score > 0:
            suggestions.append(
                {
                    "column": col,
                    "score": score,
                    "reasons": reasons,
                    "n_unique": n_unique,
                    "dtype": dtype,
                }
            )

    suggestions.sort(key=lambda item: item["score"], reverse=True)
    return {"suggestions": suggestions[:5]}


@router.get("/{session_id}/recommend")
def recommend(
    session_id: str,
    target_col: Optional[str] = Query(None),
    task: Optional[TaskType] = Query(None),
):
    df = active_df(require_session(session_id))
    n_rows, n_cols = df.shape

    if target_col and target_col not in df.columns:
        raise HTTPException(404, f"Column “{target_col}” wasn't found in this dataset.")

    inferred = infer_task_type(df, target_col) if target_col else "clustering"
    chosen = task or inferred

    return {
        "task": chosen,
        "inferred_task": inferred,
        "n_rows": n_rows,
        "n_cols": n_cols,
        "target_col": target_col,
        "id_like_columns": [
            str(c) for c in df.columns if _looks_like_id(str(c).lower().replace(" ", "_"))
        ],
        "recommendations": _registry().recommend_models(chosen, n_rows, n_cols),
    }
