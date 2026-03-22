"""Gradient Boosting and AdaBoost models (sklearn native)."""
from sklearn.ensemble import (
    GradientBoostingRegressor,
    GradientBoostingClassifier,
    HistGradientBoostingRegressor,
    HistGradientBoostingClassifier,
    AdaBoostRegressor,
    AdaBoostClassifier,
)

MODELS = {
    "gradient_boosting_reg": {
        "name": "Gradient Boosting Regressor",
        "category": "Boosting",
        "description": "Additive model built in a forward stage-wise fashion.",
        "task": "regression",
        "factory": lambda: GradientBoostingRegressor(n_estimators=100, random_state=42),
    },
    "hist_gradient_boosting_reg": {
        "name": "HistGradient Boosting Regressor",
        "category": "Boosting",
        "description": "Faster histogram-based gradient boosting (sklearn native).",
        "task": "regression",
        "factory": lambda: HistGradientBoostingRegressor(random_state=42),
    },
    "adaboost_reg": {
        "name": "AdaBoost Regressor",
        "category": "Boosting",
        "description": "Adaptive boosting that focuses on hard examples.",
        "task": "regression",
        "factory": lambda: AdaBoostRegressor(n_estimators=100, random_state=42),
    },
    "gradient_boosting_clf": {
        "name": "Gradient Boosting Classifier",
        "category": "Boosting",
        "description": "Sequential ensemble using gradient descent on residuals.",
        "task": "classification",
        "factory": lambda: GradientBoostingClassifier(n_estimators=100, random_state=42),
    },
    "hist_gradient_boosting_clf": {
        "name": "HistGradient Boosting Classifier",
        "category": "Boosting",
        "description": "Faster histogram-based gradient boosting (sklearn native).",
        "task": "classification",
        "factory": lambda: HistGradientBoostingClassifier(random_state=42),
    },
    "adaboost_clf": {
        "name": "AdaBoost Classifier",
        "category": "Boosting",
        "description": "Adaptive boosting — upweights misclassified samples.",
        "task": "classification",
        "factory": lambda: AdaBoostClassifier(n_estimators=100, random_state=42),
    },
}
