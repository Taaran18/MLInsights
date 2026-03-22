"""
Clustering models.

Some sklearn clustering extensions use compiled C extensions (_hierarchical_fast,
_optics_inner, etc.) that may be blocked by Windows Application Control policies.
Every problematic import is wrapped in try/except so the server still starts and
all remaining models are available.
"""
from sklearn.cluster import KMeans, MiniBatchKMeans, DBSCAN, MeanShift
from sklearn.mixture import GaussianMixture

MODELS: dict = {}

# ── Always-available models ────────────────────────────────────────────────

MODELS["kmeans"] = {
    "name": "K-Means",
    "category": "Centroid-based",
    "description": "Partition data into K clusters by minimizing intra-cluster variance.",
    "task": "clustering",
    "factory": lambda: KMeans(n_clusters=3, random_state=42, n_init=10),
}

MODELS["minibatch_kmeans"] = {
    "name": "Mini-Batch K-Means",
    "category": "Centroid-based",
    "description": "Faster K-Means variant using mini-batches.",
    "task": "clustering",
    "factory": lambda: MiniBatchKMeans(n_clusters=3, random_state=42),
}

MODELS["dbscan"] = {
    "name": "DBSCAN",
    "category": "Density-based",
    "description": "Discovers clusters of arbitrary shape; handles noise/outliers.",
    "task": "clustering",
    "factory": lambda: DBSCAN(eps=0.5, min_samples=5),
}

MODELS["mean_shift"] = {
    "name": "Mean Shift",
    "category": "Centroid-based",
    "description": "Finds clusters by shifting points toward density peaks.",
    "task": "clustering",
    "factory": lambda: MeanShift(),
}

MODELS["gaussian_mixture"] = {
    "name": "Gaussian Mixture Model",
    "category": "Probabilistic",
    "description": "Soft-assignment clustering using mixture of Gaussians.",
    "task": "clustering",
    "factory": lambda: GaussianMixture(n_components=3, random_state=42),
}

# ── Models backed by compiled C extensions (may be blocked by App Control) ─

try:
    from sklearn.cluster import AgglomerativeClustering
    MODELS["agglomerative"] = {
        "name": "Agglomerative Clustering",
        "category": "Hierarchical",
        "description": "Bottom-up hierarchical clustering.",
        "task": "clustering",
        "factory": lambda: AgglomerativeClustering(n_clusters=3),
    }
except (ImportError, Exception):
    pass  # _hierarchical_fast blocked or missing

try:
    from sklearn.cluster import Birch
    MODELS["birch"] = {
        "name": "BIRCH",
        "category": "Hierarchical",
        "description": "Balanced Iterative Reducing and Clustering — scalable hierarchical.",
        "task": "clustering",
        "factory": lambda: Birch(n_clusters=3),
    }
except (ImportError, Exception):
    pass  # may share the same extension

try:
    from sklearn.cluster import SpectralClustering
    MODELS["spectral"] = {
        "name": "Spectral Clustering",
        "category": "Graph-based",
        "description": "Uses graph Laplacian for non-convex clusters.",
        "task": "clustering",
        "factory": lambda: SpectralClustering(
            n_clusters=3, random_state=42, assign_labels="discretize"
        ),
    }
except (ImportError, Exception):
    pass

try:
    from sklearn.cluster import OPTICS
    MODELS["optics"] = {
        "name": "OPTICS",
        "category": "Density-based",
        "description": "Ordering points to identify clustering structure — variable density.",
        "task": "clustering",
        "factory": lambda: OPTICS(min_samples=5),
    }
except (ImportError, Exception):
    pass

try:
    from sklearn.cluster import AffinityPropagation
    MODELS["affinity_propagation"] = {
        "name": "Affinity Propagation",
        "category": "Message Passing",
        "description": "Passes messages between points to determine exemplars.",
        "task": "clustering",
        "factory": lambda: AffinityPropagation(random_state=42),
    }
except (ImportError, Exception):
    pass
