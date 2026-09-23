from sklearn.naive_bayes import GaussianNB, BernoulliNB, ComplementNB
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import MinMaxScaler

MODELS = {
    "gaussian_nb": {
        "name": "Gaussian Naive Bayes",
        "category": "Naive Bayes",
        "description": "Assumes Gaussian distribution for continuous features.",
        "task": "classification",
        "factory": lambda: GaussianNB(),
    },
    "bernoulli_nb": {
        "name": "Bernoulli Naive Bayes",
        "category": "Naive Bayes",
        "description": "Binary/boolean features — good for text classification.",
        "task": "classification",
        "factory": lambda: BernoulliNB(),
    },
    "complement_nb": {
        "name": "Complement Naive Bayes",
        "category": "Naive Bayes",
        "description": "Improved version of Multinomial NB for imbalanced datasets.",
        "task": "classification",
        "factory": lambda: make_pipeline(MinMaxScaler(clip=True), ComplementNB()),
    },
}
