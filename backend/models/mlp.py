"""Multi-Layer Perceptron (shallow neural network) models."""
from sklearn.neural_network import MLPRegressor, MLPClassifier

MODELS = {
    "mlp_reg": {
        "name": "MLP Regressor",
        "category": "Neural Network (Shallow)",
        "description": "Multi-layer perceptron — shallow neural net for regression.",
        "task": "regression",
        "factory": lambda: MLPRegressor(
            hidden_layer_sizes=(100, 50), max_iter=500, random_state=42
        ),
    },
    "mlp_clf": {
        "name": "MLP Classifier",
        "category": "Neural Network (Shallow)",
        "description": "Multi-layer perceptron — shallow neural net for classification.",
        "task": "classification",
        "factory": lambda: MLPClassifier(
            hidden_layer_sizes=(100, 50), max_iter=500, random_state=42
        ),
    },
}
