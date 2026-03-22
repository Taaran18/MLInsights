"""Linear & regularized regression models."""
from sklearn.linear_model import (
    LinearRegression,
    Ridge,
    Lasso,
    ElasticNet,
    BayesianRidge,
    HuberRegressor,
    SGDRegressor,
    TheilSenRegressor,
    RANSACRegressor,
)

MODELS = {
    "linear_regression": {
        "name": "Linear Regression",
        "category": "Linear",
        "description": "Ordinary least squares linear regression.",
        "task": "regression",
        "factory": lambda: LinearRegression(),
    },
    "ridge": {
        "name": "Ridge Regression",
        "category": "Linear / Regularized",
        "description": "L2-regularized linear regression (controls overfitting via alpha).",
        "task": "regression",
        "factory": lambda: Ridge(alpha=1.0),
    },
    "lasso": {
        "name": "Lasso Regression",
        "category": "Linear / Regularized",
        "description": "L1-regularized regression with feature selection via sparsity.",
        "task": "regression",
        "factory": lambda: Lasso(alpha=0.1, max_iter=10000),
    },
    "elasticnet": {
        "name": "ElasticNet",
        "category": "Linear / Regularized",
        "description": "Combined L1+L2 regularization.",
        "task": "regression",
        "factory": lambda: ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=10000),
    },
    "bayesian_ridge": {
        "name": "Bayesian Ridge",
        "category": "Bayesian",
        "description": "Bayesian approach to Ridge regression with automatic regularization.",
        "task": "regression",
        "factory": lambda: BayesianRidge(),
    },
    "huber": {
        "name": "Huber Regressor",
        "category": "Robust Linear",
        "description": "Robust to outliers; uses Huber loss function.",
        "task": "regression",
        "factory": lambda: HuberRegressor(max_iter=300),
    },
    "sgd_regressor": {
        "name": "SGD Regressor",
        "category": "Linear / Online",
        "description": "Stochastic gradient descent for large-scale regression.",
        "task": "regression",
        "factory": lambda: SGDRegressor(max_iter=1000, random_state=42),
    },
    "theil_sen": {
        "name": "TheilSen Regressor",
        "category": "Robust Linear",
        "description": "Robust estimator based on median of slopes.",
        "task": "regression",
        "factory": lambda: TheilSenRegressor(random_state=42, max_iter=300),
    },
    "ransac": {
        "name": "RANSAC Regressor",
        "category": "Robust Linear",
        "description": "Robust to outliers using random sample consensus.",
        "task": "regression",
        "factory": lambda: RANSACRegressor(random_state=42),
    },
}
