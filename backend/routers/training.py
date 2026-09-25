import logging
import os
import time
from datetime import datetime, timezone
from typing import List, Literal, Optional

import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from routers.common import TaskType, active_df, first_line, require_session
from utils.data_utils import safe_json
from utils.session_store import get_session_dir, remove_trained_model, set_trained_model

router = APIRouter()
logger = logging.getLogger("mlinsights.training")

ScalerType = Literal["none", "standard", "minmax", "robust"]
NON_METRIC_KEYS = {"confusion_matrix", "class_distribution", "class_labels"}


class TrainRequest(BaseModel):
    model_key: str = Field(..., min_length=1, max_length=64)
    task: TaskType
    target_col: Optional[str] = None
    feature_cols: Optional[List[str]] = Field(None, max_length=5000)
    test_size: float = Field(0.2, ge=0.05, le=0.5)
    scaler_type: ScalerType = "none"


@router.post("/{session_id}/train")
def train(session_id: str, req: TrainRequest):
    from utils import trainer

    session = require_session(session_id)
    df = active_df(session)

    model_meta = trainer.find_model(req.task, req.model_key)
    if model_meta is None:
        raise HTTPException(422, f"“{req.model_key}” isn't an available {req.task} model.")
    model_name = model_meta["name"]

    if req.task == "clustering":
        req.target_col = None

    started = time.perf_counter()
    try:
        estimator, metrics, extras, feature_cols = trainer.run_training(df, req, model_name)
    except HTTPException:
        raise
    except MemoryError:
        raise HTTPException(
            422, f"{model_name} ran out of memory on this dataset. Try a lighter model or fewer rows."
        )
    except Exception as exc:
        logger.warning("training_failed model=%s task=%s error=%s", req.model_key, req.task, first_line(exc))
        raise HTTPException(422, f"{model_name} couldn't be trained on this data: {first_line(exc)}")
    duration_ms = int((time.perf_counter() - started) * 1000)

    info = {
        "name": model_name,
        "category": model_meta.get("category"),
        "task": req.task,
        "metrics": metrics,
        "feature_importances": extras.get("feature_importances"),
        "feature_cols": feature_cols,
        "target_col": req.target_col,
        "train_size": extras.get("train_size"),
        "test_size_n": extras.get("test_size_n"),
        "test_size": req.test_size if req.task != "clustering" else None,
        "scaler_type": req.scaler_type,
        "duration_ms": duration_ms,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    set_trained_model(session_id, req.model_key, safe_json(info))

    try:
        joblib.dump(estimator, os.path.join(get_session_dir(session_id), f"{req.model_key}.pkl"))
    except Exception:
        logger.warning("model_save_failed model=%s", req.model_key)

    return safe_json(
        {
            "model_key": req.model_key,
            "model_name": model_name,
            **info,
            "labels_sample": extras.get("labels_sample"),
        }
    )


@router.get("/{session_id}/results")
def get_results(session_id: str):
    session = require_session(session_id)
    return safe_json({"trained_models": session["trained_models"]})


@router.get("/{session_id}/compare")
def compare_models(session_id: str):
    session = require_session(session_id)
    rows = []
    for key, info in session["trained_models"].items():
        row: dict = {
            "model_key": key,
            "model_name": info.get("name", key),
            "task": info.get("task"),
            "target_col": info.get("target_col"),
            "category": info.get("category"),
            "duration_ms": info.get("duration_ms"),
        }
        for metric, value in info.get("metrics", {}).items():
            if metric not in NON_METRIC_KEYS and isinstance(value, (int, float)):
                row[str(metric)] = value
        rows.append(row)
    return safe_json({"comparison": rows})


@router.delete("/{session_id}/results/{model_key}")
def delete_model_result(session_id: str, model_key: str):
    require_session(session_id)
    removed = remove_trained_model(session_id, model_key)
    return {"removed": removed, "model_key": model_key}
