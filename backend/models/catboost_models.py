"""CatBoost models."""
try:
    from catboost import CatBoostRegressor, CatBoostClassifier

    MODELS = {
        "catboost_reg": {
            "name": "CatBoost Regressor",
            "category": "Boosting",
            "description": "Gradient boosting on decision trees with native categorical support.",
            "task": "regression",
            "factory": lambda: CatBoostRegressor(iterations=100, random_state=42, verbose=0),
        },
        "catboost_clf": {
            "name": "CatBoost Classifier",
            "category": "Boosting",
            "description": "Gradient boosting with native categorical feature support.",
            "task": "classification",
            "factory": lambda: CatBoostClassifier(iterations=100, random_state=42, verbose=0),
        },
    }
except ImportError:
    MODELS = {}
