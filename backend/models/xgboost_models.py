"""XGBoost models."""
try:
    from xgboost import XGBRegressor, XGBClassifier

    MODELS = {
        "xgboost_reg": {
            "name": "XGBoost Regressor",
            "category": "Boosting",
            "description": "Extreme gradient boosting — fast, regularized, high-performance.",
            "task": "regression",
            "factory": lambda: XGBRegressor(
                n_estimators=100, random_state=42, verbosity=0
            ),
        },
        "xgboost_clf": {
            "name": "XGBoost Classifier",
            "category": "Boosting",
            "description": "Extreme gradient boosting — industry standard for tabular data.",
            "task": "classification",
            "factory": lambda: XGBClassifier(
                n_estimators=100, random_state=42, verbosity=0, eval_metric="logloss"
            ),
        },
    }
except ImportError:
    MODELS = {}
