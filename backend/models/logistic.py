"""Linear classification models."""
from sklearn.linear_model import (
    LogisticRegression,
    SGDClassifier,
    RidgeClassifier,
    Perceptron,
    PassiveAggressiveClassifier,
)

MODELS = {
    "logistic_regression": {
        "name": "Logistic Regression",
        "category": "Linear",
        "description": "Classic linear classifier using sigmoid/softmax.",
        "task": "classification",
        "factory": lambda: LogisticRegression(max_iter=1000, random_state=42),
    },
    "sgd_classifier": {
        "name": "SGD Classifier",
        "category": "Linear / Online",
        "description": "SGD-based linear classifier (SVM/logistic loss).",
        "task": "classification",
        "factory": lambda: SGDClassifier(max_iter=1000, random_state=42),
    },
    "ridge_classifier": {
        "name": "Ridge Classifier",
        "category": "Linear",
        "description": "Converts classification to regression with L2 regularization.",
        "task": "classification",
        "factory": lambda: RidgeClassifier(),
    },
    "perceptron": {
        "name": "Perceptron",
        "category": "Linear",
        "description": "Simple online linear classifier — the original neural unit.",
        "task": "classification",
        "factory": lambda: Perceptron(max_iter=1000, random_state=42),
    },
    "passive_aggressive": {
        "name": "Passive Aggressive Classifier",
        "category": "Linear / Online",
        "description": "Online large-margin classifier.",
        "task": "classification",
        "factory": lambda: PassiveAggressiveClassifier(max_iter=1000, random_state=42),
    },
}
