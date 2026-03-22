"""Linear and Quadratic Discriminant Analysis classifiers."""
from sklearn.discriminant_analysis import (
    LinearDiscriminantAnalysis,
    QuadraticDiscriminantAnalysis,
)

MODELS = {
    "lda": {
        "name": "Linear Discriminant Analysis",
        "category": "Discriminant Analysis",
        "description": "Finds linear combination of features that separates classes.",
        "task": "classification",
        "factory": lambda: LinearDiscriminantAnalysis(),
    },
    "qda": {
        "name": "Quadratic Discriminant Analysis",
        "category": "Discriminant Analysis",
        "description": "Quadratic decision boundary using class-specific covariances.",
        "task": "classification",
        "factory": lambda: QuadraticDiscriminantAnalysis(),
    },
}
