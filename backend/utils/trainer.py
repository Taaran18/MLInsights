from typing import Optional

import numpy as np
import pandas as pd
from fastapi import HTTPException
from joblib import cpu_count
from sklearn.metrics import (
    accuracy_score,
    calinski_harabasz_score,
    confusion_matrix,
    davies_bouldin_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
    silhouette_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, MinMaxScaler, RobustScaler, StandardScaler
from threadpoolctl import threadpool_limits

from utils.ml_models import ALL_MODELS, build_model

MAX_ROWS_BY_MODEL = {
    "gaussian_process_reg": 3000,
    "gaussian_process_clf": 3000,
    "affinity_propagation": 3000,
    "spectral": 5000,
    "mean_shift": 10000,
    "agglomerative": 15000,
    "optics": 20000,
}
MIN_ROWS = 10
MAX_CLASSES = 200
MAX_CONFUSION_CLASSES = 30
CV_MAX_ROWS = 20000
SILHOUETTE_SAMPLE = 10000
CPU_BUDGET = max(1, cpu_count())
BLAS_THREADS = min(2, CPU_BUDGET)
NON_METRIC_KEYS = {"confusion_matrix", "class_distribution", "class_labels"}

threadpool_limits(limits=BLAS_THREADS, user_api="blas")


def _build_scaler(scaler_type: str):
    if scaler_type == "standard":
        return StandardScaler()
    if scaler_type == "minmax":
        return MinMaxScaler()
    if scaler_type == "robust":
        return RobustScaler()
    return None


def _make_estimator(task: str, model_key: str, scaler_type: str):
    model = build_model(task, model_key)
    scaler = _build_scaler(scaler_type)
    if scaler is None:
        return model
    return Pipeline([("scaler", scaler), ("model", model)])


def _final_model(estimator):
    while isinstance(estimator, Pipeline):
        estimator = estimator.steps[-1][1]
    return estimator


def _datetime_to_seconds(series: pd.Series) -> pd.Series:
    return series.map(lambda value: value.timestamp() if pd.notna(value) else np.nan)


def _prepare_features(df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
    X = df[feature_cols].copy()
    for col in X.columns:
        series = X[col]
        if pd.api.types.is_bool_dtype(series):
            X[col] = series.astype(int)
        elif pd.api.types.is_datetime64_any_dtype(series):
            X[col] = _datetime_to_seconds(series)
        elif not pd.api.types.is_numeric_dtype(series):
            X[col] = LabelEncoder().fit_transform(series.astype(str))
    X = X.apply(pd.to_numeric, errors="coerce").replace([np.inf, -np.inf], np.nan)
    return X.fillna(X.median(numeric_only=True)).fillna(0)


def _resolve_features(df: pd.DataFrame, req) -> list:
    if req.feature_cols:
        cols = [c for c in dict.fromkeys(req.feature_cols) if c in df.columns and c != req.target_col]
    else:
        cols = [c for c in df.columns if c != req.target_col]
    if not cols:
        raise HTTPException(422, "Choose at least one feature column to train on.")
    return cols


def _prepare_target(df: pd.DataFrame, req):
    target = req.target_col
    if not target or target not in df.columns:
        raise HTTPException(422, "Choose a target column to predict before training.")

    series = df[target]
    if req.task == "regression":
        numeric = pd.to_numeric(series, errors="coerce")
        if numeric.notna().sum() < 0.9 * max(series.notna().sum(), 1):
            raise HTTPException(
                422,
                f"“{target}” isn't numeric, so it can't be a regression target. "
                "Choose a numeric column or switch to classification.",
            )
        mask = numeric.notna().to_numpy()
        return numeric.to_numpy(dtype=float)[mask], mask, None

    mask = series.notna().to_numpy()
    encoder = LabelEncoder()
    y = encoder.fit_transform(series[mask].astype(str))
    labels = [str(c) for c in encoder.classes_]
    if len(labels) < 2:
        raise HTTPException(
            422, f"“{target}” has only one distinct value, so there's nothing to classify."
        )
    if len(labels) > MAX_CLASSES:
        raise HTTPException(
            422,
            f"“{target}” has {len(labels):,} distinct values, which is too many categories. "
            "Try regression instead.",
        )
    return y, mask, labels


def _check_row_limit(model_key: str, model_name: str, rows: int):
    limit = MAX_ROWS_BY_MODEL.get(model_key)
    if limit and rows > limit:
        raise HTTPException(
            422,
            f"{model_name} needs too much memory for {rows:,} rows (limit {limit:,}). "
            "Choose a different model or use a smaller dataset.",
        )


def _extract_feature_importance(model, feature_cols: list) -> Optional[list]:
    try:
        if hasattr(model, "feature_importances_"):
            values = np.asarray(model.feature_importances_, dtype=float)
        elif hasattr(model, "coef_"):
            coefs = np.asarray(model.coef_, dtype=float)
            values = np.abs(coefs).mean(axis=0) if coefs.ndim > 1 else np.abs(coefs)
        else:
            return None
        if values.shape[0] != len(feature_cols):
            return None
        pairs = sorted(zip(feature_cols, values.tolist()), key=lambda item: item[1], reverse=True)
        return [{"feature": str(f), "importance": round(float(v), 6)} for f, v in pairs[:25]]
    except Exception:
        return None


def _regression_metrics(y_true, y_pred) -> dict:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mse = mean_squared_error(y_true, y_pred)
    metrics = {
        "R2 Score": round(float(r2_score(y_true, y_pred)), 6),
        "MAE": round(float(mean_absolute_error(y_true, y_pred)), 6),
        "MSE": round(float(mse), 6),
        "RMSE": round(float(np.sqrt(mse)), 6),
    }
    nonzero = np.abs(y_true) > 1e-9
    if nonzero.mean() >= 0.5:
        mape = np.mean(np.abs((y_true[nonzero] - y_pred[nonzero]) / y_true[nonzero])) * 100
        metrics["MAPE (%)"] = round(float(mape), 4)
    return metrics


def _classification_metrics(y_true, y_pred, y_proba, labels: list) -> dict:
    n_classes = len(labels)
    average = "binary" if n_classes == 2 else "weighted"
    metrics = {
        "Accuracy": round(float(accuracy_score(y_true, y_pred)), 6),
        "Precision": round(float(precision_score(y_true, y_pred, average=average, zero_division=0)), 6),
        "Recall": round(float(recall_score(y_true, y_pred, average=average, zero_division=0)), 6),
        "F1 Score": round(float(f1_score(y_true, y_pred, average=average, zero_division=0)), 6),
    }
    if y_proba is not None:
        try:
            if n_classes == 2:
                auc = roc_auc_score(y_true, y_proba[:, 1])
            else:
                auc = roc_auc_score(
                    y_true, y_proba, multi_class="ovr", average="weighted", labels=list(range(n_classes))
                )
            metrics["ROC AUC"] = round(float(auc), 6)
        except Exception:
            pass
    if n_classes <= MAX_CONFUSION_CLASSES:
        metrics["confusion_matrix"] = confusion_matrix(y_true, y_pred, labels=list(range(n_classes))).tolist()
    classes, counts = np.unique(y_true, return_counts=True)
    metrics["class_distribution"] = {labels[int(c)]: int(n) for c, n in zip(classes, counts)}
    metrics["class_labels"] = labels
    return metrics


def _clustering_metrics(X, labels) -> dict:
    metrics: dict = {}
    unique = set(labels.tolist())
    valid = labels != -1
    if len(unique - {-1}) >= 2 and valid.sum() > 2:
        X_valid, labels_valid = X[valid], labels[valid]
        sample = min(SILHOUETTE_SAMPLE, len(labels_valid))
        for name, fn in (
            ("Silhouette Score", lambda: silhouette_score(X_valid, labels_valid, sample_size=sample, random_state=42)),
            ("Davies-Bouldin Score", lambda: davies_bouldin_score(X_valid, labels_valid)),
            ("Calinski-Harabasz Score", lambda: calinski_harabasz_score(X_valid, labels_valid)),
        ):
            try:
                metrics[name] = round(float(fn()), 6)
            except Exception:
                pass
    metrics["n_clusters"] = len(unique - {-1})
    metrics["n_noise_points"] = int((labels == -1).sum())
    return metrics


def _stratify_or_none(y, test_size: float):
    _, counts = np.unique(y, return_counts=True)
    if counts.min() < 2 or int(len(y) * test_size) < len(counts):
        return None
    return y


def _train_supervised(df: pd.DataFrame, req, model_name: str, feature_cols: list):
    y, mask, labels = _prepare_target(df, req)
    X = _prepare_features(df.loc[mask], feature_cols).to_numpy(dtype=float)
    rows = X.shape[0]
    if rows < MIN_ROWS:
        raise HTTPException(
            422, f"Only {rows} rows have a value in “{req.target_col}”. At least {MIN_ROWS} are needed."
        )
    _check_row_limit(req.model_key, model_name, rows)

    stratify = _stratify_or_none(y, req.test_size) if req.task == "classification" else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=req.test_size, random_state=42, stratify=stratify
    )

    estimator = _make_estimator(req.task, req.model_key, req.scaler_type)
    estimator.fit(X_train, y_train)
    y_pred = estimator.predict(X_test)

    if req.task == "regression":
        metrics = _regression_metrics(y_test, y_pred)
    else:
        y_proba = None
        if hasattr(estimator, "predict_proba"):
            try:
                y_proba = estimator.predict_proba(X_test)
            except Exception:
                y_proba = None
        metrics = _classification_metrics(y_test, y_pred, y_proba, labels or [])

    if rows <= CV_MAX_ROWS:
        try:
            scores = cross_val_score(
                _make_estimator(req.task, req.model_key, req.scaler_type),
                X,
                y,
                cv=5,
                scoring="r2" if req.task == "regression" else "accuracy",
            )
            metrics["CV Mean"] = round(float(scores.mean()), 6)
            metrics["CV Std"] = round(float(scores.std()), 6)
        except Exception:
            pass

    return estimator, metrics, {
        "train_size": int(len(X_train)),
        "test_size_n": int(len(X_test)),
        "feature_importances": _extract_feature_importance(_final_model(estimator), feature_cols),
    }


def _train_clustering(df: pd.DataFrame, req, model_name: str, feature_cols: list):
    X = _prepare_features(df, feature_cols).to_numpy(dtype=float)
    if X.shape[0] < MIN_ROWS:
        raise HTTPException(422, f"At least {MIN_ROWS} rows are needed for clustering.")
    _check_row_limit(req.model_key, model_name, X.shape[0])

    estimator = _make_estimator(req.task, req.model_key, req.scaler_type)
    labels = np.asarray(estimator.fit_predict(X))
    X_used = estimator[:-1].transform(X) if isinstance(estimator, Pipeline) else X
    return estimator, _clustering_metrics(X_used, labels), {
        "labels_sample": labels[:100].tolist(),
        "feature_importances": None,
    }


def find_model(task: str, model_key: str) -> Optional[dict]:
    return ALL_MODELS.get(task, {}).get(model_key)


def run_training(df: pd.DataFrame, req, model_name: str):
    feature_cols = _resolve_features(df, req)
    with threadpool_limits(limits=CPU_BUDGET, user_api="openmp"):
        if req.task == "clustering":
            estimator, metrics, extras = _train_clustering(df, req, model_name, feature_cols)
        else:
            estimator, metrics, extras = _train_supervised(df, req, model_name, feature_cols)
    return estimator, metrics, extras, feature_cols
