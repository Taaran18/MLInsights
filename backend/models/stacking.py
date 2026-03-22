"""Stacking and Voting ensemble models."""
from sklearn.ensemble import (
    StackingRegressor,
    StackingClassifier,
    VotingRegressor,
    VotingClassifier,
)
from sklearn.linear_model import LinearRegression, Ridge, LogisticRegression
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier


def _base_reg():
    return [
        ("lr", LinearRegression()),
        ("dt", DecisionTreeRegressor(max_depth=5, random_state=42)),
    ]


def _base_clf():
    return [
        ("lr", LogisticRegression(max_iter=500, random_state=42)),
        ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
    ]


def _base_clf_soft():
    return [
        ("lr", LogisticRegression(max_iter=500, random_state=42)),
        ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
        ("rf", RandomForestClassifier(n_estimators=50, random_state=42)),
    ]


MODELS = {
    "stacking_reg": {
        "name": "Stacking Regressor",
        "category": "Stacking",
        "description": "Meta-learning: stacks multiple base regressors with a meta-estimator.",
        "task": "regression",
        "factory": lambda: StackingRegressor(
            estimators=_base_reg(),
            final_estimator=Ridge(),
            cv=5,
        ),
    },
    "voting_reg": {
        "name": "Voting Regressor",
        "category": "Stacking",
        "description": "Averages predictions from multiple regressors.",
        "task": "regression",
        "factory": lambda: VotingRegressor(estimators=_base_reg()),
    },
    "stacking_clf": {
        "name": "Stacking Classifier",
        "category": "Stacking",
        "description": "Meta-learning: trains a meta-classifier on base classifier outputs.",
        "task": "classification",
        "factory": lambda: StackingClassifier(
            estimators=_base_clf(),
            final_estimator=LogisticRegression(max_iter=500),
            cv=5,
        ),
    },
    "voting_clf_hard": {
        "name": "Voting Classifier (Hard)",
        "category": "Stacking",
        "description": "Majority vote from multiple classifiers.",
        "task": "classification",
        "factory": lambda: VotingClassifier(estimators=_base_clf(), voting="hard"),
    },
    "voting_clf_soft": {
        "name": "Voting Classifier (Soft)",
        "category": "Stacking",
        "description": "Probability-weighted vote from multiple classifiers.",
        "task": "classification",
        "factory": lambda: VotingClassifier(estimators=_base_clf_soft(), voting="soft"),
    },
}
