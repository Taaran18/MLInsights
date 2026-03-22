"""Decision Tree models (single trees)."""
from sklearn.tree import (
    DecisionTreeRegressor,
    DecisionTreeClassifier,
    ExtraTreeRegressor,
    ExtraTreeClassifier,
)

MODELS = {
    "decision_tree_reg": {
        "name": "Decision Tree Regressor",
        "category": "Tree-based",
        "description": "Simple tree that splits data to minimize MSE.",
        "task": "regression",
        "factory": lambda: DecisionTreeRegressor(random_state=42),
    },
    "extra_tree_reg": {
        "name": "Extra Tree Regressor",
        "category": "Tree-based",
        "description": "Extremely randomized single tree regressor.",
        "task": "regression",
        "factory": lambda: ExtraTreeRegressor(random_state=42),
    },
    "decision_tree_clf": {
        "name": "Decision Tree Classifier",
        "category": "Tree-based",
        "description": "Recursive binary splits on feature thresholds.",
        "task": "classification",
        "factory": lambda: DecisionTreeClassifier(random_state=42),
    },
    "extra_tree_clf": {
        "name": "Extra Tree Classifier",
        "category": "Tree-based",
        "description": "Single extremely randomized tree.",
        "task": "classification",
        "factory": lambda: ExtraTreeClassifier(random_state=42),
    },
}
