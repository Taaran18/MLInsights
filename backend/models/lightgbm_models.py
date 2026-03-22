"""LightGBM models."""
try:
    from lightgbm import LGBMRegressor, LGBMClassifier

    MODELS = {
        "lgbm_reg": {
            "name": "LightGBM Regressor",
            "category": "Boosting",
            "description": "Fast, distributed, high-performance gradient boosting framework.",
            "task": "regression",
            "factory": lambda: LGBMRegressor(n_estimators=100, random_state=42, verbose=-1),
        },
        "lgbm_clf": {
            "name": "LightGBM Classifier",
            "category": "Boosting",
            "description": "Fast, distributed gradient boosting — great for large datasets.",
            "task": "classification",
            "factory": lambda: LGBMClassifier(n_estimators=100, random_state=42, verbose=-1),
        },
    }
except ImportError:
    MODELS = {}
