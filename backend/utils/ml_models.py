"""
Central ML model registry.

Aggregates models from individual files in backend/models/.
Each file exposes a MODELS dict keyed by model_key.
"""
import sys
import os

# Ensure the backend/ root is on sys.path so `models.*` is resolvable
# regardless of which directory uvicorn / the IDE resolves from.
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from models import (
    linear_regression,
    logistic,
    tree,
    random_forest,
    gradient_boosting,
    xgboost_models,
    lightgbm_models,
    catboost_models,
    stacking,
    svm,
    knn,
    naive_bayes,
    discriminant,
    mlp,
    gaussian_process,
    clustering,
)

# ── Build task-grouped registries ─────────────────────────────────────────

REGRESSION_MODELS: dict = {}
CLASSIFICATION_MODELS: dict = {}
CLUSTERING_MODELS: dict = {}

_ALL_MODULE_MODELS = [
    linear_regression.MODELS,
    logistic.MODELS,
    tree.MODELS,
    random_forest.MODELS,
    gradient_boosting.MODELS,
    xgboost_models.MODELS,
    lightgbm_models.MODELS,
    catboost_models.MODELS,
    stacking.MODELS,
    svm.MODELS,
    knn.MODELS,
    naive_bayes.MODELS,
    discriminant.MODELS,
    mlp.MODELS,
    gaussian_process.MODELS,
    clustering.MODELS,
]

for _module_models in _ALL_MODULE_MODELS:
    for key, meta in _module_models.items():
        task = meta.get("task", "")
        if task == "regression":
            REGRESSION_MODELS[key] = meta
        elif task == "classification":
            CLASSIFICATION_MODELS[key] = meta
        elif task == "clustering":
            CLUSTERING_MODELS[key] = meta

ALL_MODELS = {
    "regression": REGRESSION_MODELS,
    "classification": CLASSIFICATION_MODELS,
    "clustering": CLUSTERING_MODELS,
}


# ── Public helpers ────────────────────────────────────────────────────────

def get_model_catalog() -> dict:
    """Return serializable model catalog (no factory functions)."""
    catalog: dict = {}
    for task, models in ALL_MODELS.items():
        catalog[task] = [
            {
                "key": key,
                "name": meta["name"],
                "category": meta["category"],
                "description": meta["description"],
            }
            for key, meta in models.items()
        ]
    return catalog


def build_model(task: str, model_key: str):
    """Instantiate a fresh model by task + key."""
    registry = ALL_MODELS.get(task, {})
    meta = registry.get(model_key)
    if not meta:
        raise ValueError(f"Unknown model: {task}/{model_key}")
    return meta["factory"]()


def recommend_models(task: str, n_rows: int, n_cols: int) -> list:
    """Return recommended model metadata for a given task and dataset size."""
    if task == "regression":
        if n_rows < 1000:
            keys = ["linear_regression", "ridge", "decision_tree_reg",
                    "random_forest_reg", "gradient_boosting_reg",
                    "xgboost_reg", "svr", "knn_reg"]
        elif n_rows < 50_000:
            keys = ["random_forest_reg", "gradient_boosting_reg",
                    "xgboost_reg", "lgbm_reg", "catboost_reg",
                    "hist_gradient_boosting_reg", "ridge", "lasso"]
        else:
            keys = ["lgbm_reg", "xgboost_reg", "hist_gradient_boosting_reg",
                    "sgd_regressor", "linear_regression", "random_forest_reg"]

    elif task == "classification":
        if n_rows < 1000:
            keys = ["logistic_regression", "decision_tree_clf",
                    "random_forest_clf", "svc", "knn_clf",
                    "gaussian_nb", "gradient_boosting_clf"]
        elif n_rows < 50_000:
            keys = ["random_forest_clf", "gradient_boosting_clf",
                    "xgboost_clf", "lgbm_clf", "catboost_clf",
                    "logistic_regression", "svc"]
        else:
            keys = ["lgbm_clf", "xgboost_clf", "hist_gradient_boosting_clf",
                    "random_forest_clf", "logistic_regression", "sgd_classifier"]

    else:  # clustering
        if n_rows < 5_000:
            keys = ["kmeans", "dbscan", "agglomerative",
                    "gaussian_mixture", "spectral"]
        else:
            keys = ["kmeans", "minibatch_kmeans", "dbscan",
                    "birch", "mean_shift"]

    registry = ALL_MODELS.get(task, {})
    return [
        {
            "key": k,
            "name": registry[k]["name"],
            "category": registry[k]["category"],
            "description": registry[k]["description"],
        }
        for k in keys
        if k in registry   # skip any that failed to import (e.g. blocked DLLs)
    ]
