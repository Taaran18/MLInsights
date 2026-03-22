"""Gaussian Process models."""
from sklearn.gaussian_process import GaussianProcessRegressor, GaussianProcessClassifier

MODELS = {
    "gaussian_process_reg": {
        "name": "Gaussian Process Regressor",
        "category": "Probabilistic",
        "description": "Probabilistic regression with confidence intervals.",
        "task": "regression",
        "factory": lambda: GaussianProcessRegressor(random_state=42),
    },
    "gaussian_process_clf": {
        "name": "Gaussian Process Classifier",
        "category": "Probabilistic",
        "description": "Probabilistic classifier based on Gaussian processes.",
        "task": "classification",
        "factory": lambda: GaussianProcessClassifier(random_state=42),
    },
}
