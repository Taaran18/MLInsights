"""Support Vector Machine models."""
from sklearn.svm import SVR, SVC, LinearSVR, LinearSVC, NuSVR, NuSVC

MODELS = {
    "svr": {
        "name": "Support Vector Regressor (RBF)",
        "category": "SVM",
        "description": "SVR with RBF kernel — effective for non-linear relationships.",
        "task": "regression",
        "factory": lambda: SVR(kernel="rbf", C=1.0),
    },
    "linear_svr": {
        "name": "Linear SVR",
        "category": "SVM",
        "description": "Linear support vector regression — faster for large datasets.",
        "task": "regression",
        "factory": lambda: LinearSVR(max_iter=2000, random_state=42),
    },
    "nu_svr": {
        "name": "Nu-SVR",
        "category": "SVM",
        "description": "Nu variant of SVR with nu parameter controlling support vectors.",
        "task": "regression",
        "factory": lambda: NuSVR(kernel="rbf"),
    },
    "svc": {
        "name": "Support Vector Classifier (RBF)",
        "category": "SVM",
        "description": "SVC with RBF kernel — powerful for non-linear boundaries.",
        "task": "classification",
        "factory": lambda: SVC(kernel="rbf", probability=True, random_state=42),
    },
    "linear_svc": {
        "name": "Linear SVC",
        "category": "SVM",
        "description": "Fast SVM with linear kernel — good for high-dimensional data.",
        "task": "classification",
        "factory": lambda: LinearSVC(max_iter=2000, random_state=42),
    },
    "nu_svc": {
        "name": "Nu-SVC",
        "category": "SVM",
        "description": "Nu variant of SVC with nu parameter.",
        "task": "classification",
        "factory": lambda: NuSVC(probability=True, random_state=42),
    },
}
