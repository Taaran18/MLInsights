"""Random Forest and Bagging ensemble models."""
from sklearn.ensemble import (
    RandomForestRegressor,
    RandomForestClassifier,
    ExtraTreesRegressor,
    ExtraTreesClassifier,
    BaggingRegressor,
    BaggingClassifier,
)

MODELS = {
    "random_forest_reg": {
        "name": "Random Forest Regressor",
        "category": "Ensemble / Bagging",
        "description": "Bagging of decision trees with random feature selection.",
        "task": "regression",
        "factory": lambda: RandomForestRegressor(n_estimators=100, random_state=42),
    },
    "extra_trees_reg": {
        "name": "Extra Trees Regressor",
        "category": "Ensemble / Bagging",
        "description": "Extremely randomized forests — faster than Random Forest.",
        "task": "regression",
        "factory": lambda: ExtraTreesRegressor(n_estimators=100, random_state=42),
    },
    "bagging_reg": {
        "name": "Bagging Regressor",
        "category": "Ensemble / Bagging",
        "description": "Bootstrap aggregation with base estimator.",
        "task": "regression",
        "factory": lambda: BaggingRegressor(n_estimators=50, random_state=42),
    },
    "random_forest_clf": {
        "name": "Random Forest Classifier",
        "category": "Ensemble / Bagging",
        "description": "Bagging of decision trees — reduces variance.",
        "task": "classification",
        "factory": lambda: RandomForestClassifier(n_estimators=100, random_state=42),
    },
    "extra_trees_clf": {
        "name": "Extra Trees Classifier",
        "category": "Ensemble / Bagging",
        "description": "Extremely randomized forests — often faster and comparable accuracy.",
        "task": "classification",
        "factory": lambda: ExtraTreesClassifier(n_estimators=100, random_state=42),
    },
    "bagging_clf": {
        "name": "Bagging Classifier",
        "category": "Ensemble / Bagging",
        "description": "Bootstrap aggregation with any base classifier.",
        "task": "classification",
        "factory": lambda: BaggingClassifier(n_estimators=50, random_state=42),
    },
}
