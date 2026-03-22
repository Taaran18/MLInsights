"""K-Nearest Neighbors models."""
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier

MODELS = {
    "knn_reg": {
        "name": "K-Nearest Neighbors Regressor",
        "category": "Instance-based",
        "description": "Predicts by averaging the K nearest training samples.",
        "task": "regression",
        "factory": lambda: KNeighborsRegressor(n_neighbors=5),
    },
    "knn_clf": {
        "name": "K-Nearest Neighbors Classifier",
        "category": "Instance-based",
        "description": "Classifies by majority vote among K nearest neighbors.",
        "task": "classification",
        "factory": lambda: KNeighborsClassifier(n_neighbors=5),
    },
}
