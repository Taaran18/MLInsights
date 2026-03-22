import os
import numpy as np
import pandas as pd
import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler, RobustScaler
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix,
    silhouette_score, davies_bouldin_score, calinski_harabasz_score,
)
from utils.session_store import get_session, get_active_df, update_session, get_session_dir
from utils.ml_models import build_model, ALL_MODELS
from utils.data_utils import infer_task_type, safe_json

router = APIRouter()


class TrainRequest(BaseModel):
    model_key: str
    task: str                        # "regression" | "classification" | "clustering"
    target_col: Optional[str] = None
    feature_cols: Optional[List[str]] = None
    test_size: float = 0.2
    scaler_type: str = "none"        # "none" | "standard" | "minmax" | "robust"


def _build_scaler(scaler_type: str):
    """Return the appropriate scaler or None."""
    if scaler_type == "standard":
        return StandardScaler()
    if scaler_type == "minmax":
        return MinMaxScaler()
    if scaler_type == "robust":
        return RobustScaler()
    return None


def _prepare_features(df: pd.DataFrame, feature_cols: list, target_col: Optional[str] = None):
    """Encode categoricals, return X (and optionally y)."""
    X = df[feature_cols].copy()
    for col in X.select_dtypes(include=["object", "category"]).columns:
        X[col] = LabelEncoder().fit_transform(X[col].astype(str))
    X = X.fillna(X.median(numeric_only=True))

    if target_col:
        y = df[target_col].copy()
        if y.dtype == object or str(y.dtype) == "category":
            y = LabelEncoder().fit_transform(y.astype(str))
        else:
            y = y.fillna(y.median())
        return X, y
    return X


def _fmt(v) -> float:
    """Round to 6 dp and return a plain Python float — satisfies pyright."""
    return float(np.round(float(v), 6))


def _extract_feature_importance(model, feature_cols: list) -> Optional[list]:
    """Extract feature importance as sorted list of {feature, importance}."""
    try:
        # Tree / ensemble models
        if hasattr(model, "feature_importances_"):
            raw: list = list(zip(feature_cols, model.feature_importances_.tolist()))
            raw.sort(key=lambda x: x[1], reverse=True)  # type: ignore[arg-type]
            return [{"feature": str(f), "importance": _fmt(v)} for f, v in raw[:25]]

        # Linear models (coef_)
        if hasattr(model, "coef_"):
            coefs = np.array(model.coef_)
            coefs = np.abs(coefs).mean(axis=0) if coefs.ndim > 1 else np.abs(coefs)
            raw2: list = list(zip(feature_cols, coefs.tolist()))
            raw2.sort(key=lambda x: x[1], reverse=True)  # type: ignore[arg-type]
            return [{"feature": str(f), "importance": _fmt(v)} for f, v in raw2[:25]]
    except Exception:
        pass
    return None


def _regression_metrics(y_true, y_pred) -> dict:
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = float(np.sqrt(mse))
    r2 = r2_score(y_true, y_pred)
    mape = float(np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + 1e-8))) * 100)
    return {
        "R2 Score":  round(float(r2), 6),
        "MAE":       round(float(mae), 6),
        "MSE":       round(float(mse), 6),
        "RMSE":      round(rmse, 6),
        "MAPE (%)":  round(mape, 4),
    }


def _classification_metrics(y_true, y_pred, y_proba=None) -> dict:
    avg = "binary" if len(np.unique(y_true)) == 2 else "weighted"
    metrics = {
        "Accuracy":  round(float(accuracy_score(y_true, y_pred)), 6),
        "Precision": round(float(precision_score(y_true, y_pred, average=avg, zero_division=0)), 6),
        "Recall":    round(float(recall_score(y_true, y_pred, average=avg, zero_division=0)), 6),
        "F1 Score":  round(float(f1_score(y_true, y_pred, average=avg, zero_division=0)), 6),
    }
    if y_proba is not None:
        try:
            if avg == "binary":
                auc = roc_auc_score(y_true, y_proba[:, 1])
            else:
                auc = roc_auc_score(y_true, y_proba, multi_class="ovr", average="weighted")
            metrics["ROC AUC"] = round(float(auc), 6)
        except Exception:
            pass
    metrics["confusion_matrix"] = confusion_matrix(y_true, y_pred).tolist()
    # Per-class counts
    classes, counts = np.unique(y_true, return_counts=True)
    metrics["class_distribution"] = {str(int(c)): int(n) for c, n in zip(classes, counts)}
    return metrics


def _clustering_metrics(X, labels) -> dict:
    metrics = {}
    unique_labels = set(labels)
    valid = labels != -1
    if len(unique_labels - {-1}) >= 2 and valid.sum() > 1:
        try:
            metrics["Silhouette Score"] = round(float(silhouette_score(X[valid], labels[valid])), 6)
        except Exception:
            pass
        try:
            metrics["Davies-Bouldin Score"] = round(float(davies_bouldin_score(X[valid], labels[valid])), 6)
        except Exception:
            pass
        try:
            metrics["Calinski-Harabasz Score"] = round(float(calinski_harabasz_score(X[valid], labels[valid])), 6)
        except Exception:
            pass
    metrics["n_clusters"] = len(unique_labels - {-1})
    metrics["n_noise_points"] = int((labels == -1).sum())
    return metrics


@router.post("/{session_id}/train")
def train(session_id: str, req: TrainRequest):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    df = get_active_df(session_id)

    if req.model_key not in ALL_MODELS.get(req.task, {}):
        raise HTTPException(400, f"Model '{req.model_key}' not found for task '{req.task}'.")

    if req.feature_cols:
        feature_cols = [c for c in req.feature_cols if c in df.columns]
    else:
        if req.target_col and req.target_col in df.columns:
            feature_cols = [c for c in df.columns if c != req.target_col]
        else:
            feature_cols = df.columns.tolist()

    model_meta = ALL_MODELS[req.task][req.model_key]
    model_name = model_meta["name"]
    model = build_model(req.task, req.model_key)

    result = {
        "model_key": req.model_key,
        "model_name": model_name,
        "task": req.task,
        "feature_cols": feature_cols,
        "target_col": req.target_col,
        "feature_importances": None,
    }

    try:
        if req.task == "clustering":
            X_df = _prepare_features(df, feature_cols)
            X_raw = np.asarray(X_df)
            scaler = _build_scaler(req.scaler_type)
            X_scaled = scaler.fit_transform(X_raw) if scaler is not None else X_raw

            labels = model.fit_predict(X_scaled)
            metrics = _clustering_metrics(X_scaled, labels)
            result["metrics"] = metrics
            result["labels_sample"] = labels[:100].tolist()

        else:
            if not req.target_col or req.target_col not in df.columns:
                raise HTTPException(400, "target_col is required for supervised learning.")

            X, y = _prepare_features(df, feature_cols, req.target_col)
            X_arr = X.values

            scaler = _build_scaler(req.scaler_type)
            if scaler is not None:
                X_arr = scaler.fit_transform(X_arr)

            X_train, X_test, y_train, y_test = train_test_split(
                X_arr, y, test_size=req.test_size, random_state=42
            )

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            if req.task == "regression":
                metrics = _regression_metrics(y_test, y_pred)
            else:
                y_proba = None
                if hasattr(model, "predict_proba"):
                    try:
                        y_proba = model.predict_proba(X_test)
                    except Exception:
                        pass
                metrics = _classification_metrics(y_test, y_pred, y_proba)

            # Cross-validation
            try:
                cv_metric = "r2" if req.task == "regression" else "accuracy"
                cv_scores = cross_val_score(
                    build_model(req.task, req.model_key), X_arr, y, cv=5, scoring=cv_metric
                )
                metrics["CV Mean"] = round(float(cv_scores.mean()), 6)
                metrics["CV Std"]  = round(float(cv_scores.std()), 6)
            except Exception:
                pass

            result["metrics"] = metrics
            result["train_size"] = len(X_train)
            result["test_size_n"] = len(X_test)

            # Feature importances
            result["feature_importances"] = _extract_feature_importance(model, feature_cols)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Training failed: {str(e)}")

    # Persist full result in session (including confusion_matrix & feature_importances)
    trained = session.get("trained_models", {})
    trained[req.model_key] = {
        "name": model_name,
        "task": req.task,
        "metrics": result.get("metrics", {}),
        "feature_importances": result.get("feature_importances"),
        "feature_cols": feature_cols,
        "target_col": req.target_col,
        "train_size": result.get("train_size"),
        "test_size_n": result.get("test_size_n"),
    }
    update_session(session_id, trained_models=trained)

    # Save fitted model as .pkl for later download
    try:
        pkl_path = os.path.join(get_session_dir(session_id), f"{req.model_key}.pkl")
        joblib.dump(model, pkl_path)
    except Exception:
        pass  # pkl save is non-critical

    return safe_json(result)


@router.get("/{session_id}/results")
def get_results(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    return safe_json({"trained_models": session.get("trained_models", {})})


@router.get("/{session_id}/compare")
def compare_models(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    trained = session.get("trained_models", {})
    if not trained:
        return {"comparison": [], "message": "No models trained yet."}

    rows = []
    for key, info in trained.items():
        # Exclude non-numeric/complex fields from the comparison table
        row: dict[str, object] = {"model_key": key, "model_name": info["name"], "task": info["task"]}
        for k, v in info.get("metrics", {}).items():
            if str(k) not in ("confusion_matrix", "class_distribution") and isinstance(v, (int, float)):
                row[str(k)] = v
        rows.append(row)

    return safe_json({"comparison": rows})


@router.delete("/{session_id}/results/{model_key}")
def delete_model_result(session_id: str, model_key: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    trained = session.get("trained_models", {})
    trained.pop(model_key, None)
    update_session(session_id, trained_models=trained)
    return {"message": f"Removed {model_key} from results."}
