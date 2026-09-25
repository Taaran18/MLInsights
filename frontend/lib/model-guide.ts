export interface Formula {
  label: string;
  expression: string;
  note?: string;
}

export interface ModelGuide {
  kind: string;
  summary: string;
  purpose: string;
  steps: string[];
  formulas: Formula[];
  strengths: string[];
  limitations: string[];
  settings?: string;
}

const TREE_SPLIT: Formula = {
  label: "Best Split",
  expression: "ΔI = I(parent) − (n_L ÷ n)·I(left) − (n_R ÷ n)·I(right)",
  note: "Each split is the one that lowers impurity I the most.",
};

const GINI: Formula = {
  label: "Gini Impurity (Classification)",
  expression: "Gini = 1 − Σₖ pₖ²",
  note: "pₖ is the share of rows in the node that belong to class k.",
};

const MSE_IMPURITY: Formula = {
  label: "Impurity (Regression)",
  expression: "MSE = (1 ÷ n) · Σᵢ (yᵢ − ȳ)²",
  note: "ȳ is the average target in the node, which is also its prediction.",
};

const BOOSTING_UPDATE: Formula = {
  label: "Additive Update",
  expression: "Fₘ(x) = Fₘ₋₁(x) + ν · hₘ(x)",
  note: "Each new tree hₘ is scaled by the learning rate ν and added to the ensemble.",
};

const PSEUDO_RESIDUAL: Formula = {
  label: "What Each Tree Learns",
  expression: "rᵢ = −∂L(yᵢ, F(xᵢ)) ÷ ∂F(xᵢ)",
  note: "Trees are fit to the negative gradient of the loss, the direction that reduces error fastest.",
};

const RBF_KERNEL: Formula = {
  label: "RBF Kernel",
  expression: "K(x, x′) = exp(−γ · ‖x − x′‖²)",
  note: "Measures similarity: 1 for identical points, falling toward 0 as they move apart.",
};

const EUCLIDEAN: Formula = {
  label: "Distance",
  expression: "d(x, x′) = √( Σⱼ (xⱼ − x′ⱼ)² )",
};

const GUIDES = {
  linear: {
    kind: "Linear Model",
    summary:
      "Fits a straight-line (or flat-plane) relationship between the inputs and the target by finding the weights that make the squared errors as small as possible.",
    purpose:
      "A fast, transparent baseline for predicting numbers. Great when the target changes roughly in proportion to the inputs.",
    steps: [
      "Give every input column a weight and add a constant intercept.",
      "Choose the weights that minimize the sum of squared differences between predictions and actual values.",
      "Predict by multiplying each input by its weight and adding them up.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = β₀ + β₁x₁ + β₂x₂ + … + βₚxₚ",
      },
      {
        label: "Objective (Least Squares)",
        expression: "minimize Σᵢ (yᵢ − ŷᵢ)²",
      },
      {
        label: "Closed-Form Solution",
        expression: "β = (XᵀX)⁻¹ Xᵀy",
      },
    ],
    strengths: [
      "Trains almost instantly, even on large data.",
      "Every weight is directly interpretable.",
      "Hard to overfit when there are many more rows than columns.",
    ],
    limitations: [
      "Misses curved or interacting relationships.",
      "Sensitive to outliers and to strongly correlated inputs.",
    ],
  },
  ridge: {
    kind: "Regularized Linear Model",
    summary:
      "Linear regression with an L2 penalty that shrinks all weights toward zero, which keeps the model stable when inputs are correlated.",
    purpose:
      "Use it instead of plain linear regression when you have many related columns or want less variance in the weights.",
    steps: [
      "Start from the least-squares objective.",
      "Add a penalty proportional to the sum of squared weights.",
      "Solve for weights that balance fit against size, controlled by α.",
    ],
    formulas: [
      {
        label: "Objective",
        expression: "minimize Σᵢ (yᵢ − ŷᵢ)² + α · Σⱼ βⱼ²",
        note: "Larger α shrinks weights more strongly.",
      },
      {
        label: "Solution",
        expression: "β = (XᵀX + αI)⁻¹ Xᵀy",
      },
    ],
    strengths: [
      "Handles correlated inputs gracefully.",
      "Still fast and interpretable.",
      "Reduces overfitting compared with plain least squares.",
    ],
    limitations: [
      "Never sets weights exactly to zero, so it doesn't select features.",
      "Still a linear model.",
    ],
    settings: "Uses α = 1.0.",
  },
  ridgeClassifier: {
    kind: "Regularized Linear Classifier",
    summary:
      "Turns classification into regression: each class is encoded as +1 or −1, a ridge regression is fit, and the class with the highest output wins.",
    purpose:
      "A very fast linear classifier that works well with many features, such as text or wide tables.",
    steps: [
      "Encode each class as a column of +1 (belongs) and −1 (doesn't).",
      "Fit a ridge regression to each encoded column.",
      "Predict the class whose regression output is largest.",
    ],
    formulas: [
      {
        label: "Objective",
        expression: "minimize ‖Y − XB‖² + α · ‖B‖²",
      },
      {
        label: "Prediction",
        expression: "ŷ = argmaxₖ (xᵀβₖ + bₖ)",
      },
    ],
    strengths: [
      "Extremely fast, with a closed-form solution.",
      "Stable when features are correlated.",
      "Handles many classes easily.",
    ],
    limitations: [
      "No probability estimates.",
      "Linear decision boundaries only.",
    ],
  },
  lasso: {
    kind: "Regularized Linear Model",
    summary:
      "Linear regression with an L1 penalty that can push some weights all the way to zero, effectively choosing which inputs matter.",
    purpose:
      "Use it when you suspect only a few columns really drive the target and you want a simpler, sparser model.",
    steps: [
      "Start from the least-squares objective.",
      "Add a penalty proportional to the sum of absolute weights.",
      "Optimize with coordinate descent; unhelpful weights become exactly zero.",
    ],
    formulas: [
      {
        label: "Objective",
        expression: "minimize (1 ÷ 2n) · Σᵢ (yᵢ − ŷᵢ)² + α · Σⱼ |βⱼ|",
      },
    ],
    strengths: [
      "Built-in feature selection.",
      "Produces compact, readable models.",
      "Fast to train.",
    ],
    limitations: [
      "Picks one feature arbitrarily from a group of correlated ones.",
      "Can underfit if α is too large.",
    ],
    settings: "Uses α = 0.1.",
  },
  elasticnet: {
    kind: "Regularized Linear Model",
    summary:
      "Combines the Lasso (L1) and Ridge (L2) penalties, so it can drop useless columns while still handling groups of correlated ones.",
    purpose:
      "A good middle ground when you have many correlated inputs and also want some feature selection.",
    steps: [
      "Start from the least-squares objective.",
      "Add a blend of absolute and squared weight penalties.",
      "The mix ρ decides how Lasso-like or Ridge-like the model is.",
    ],
    formulas: [
      {
        label: "Objective",
        expression:
          "minimize (1 ÷ 2n)·‖y − Xβ‖² + α·ρ·‖β‖₁ + (α·(1 − ρ) ÷ 2)·‖β‖₂²",
        note: "ρ is the L1 ratio: 1 is pure Lasso, 0 is pure Ridge.",
      },
    ],
    strengths: [
      "Keeps groups of correlated features together.",
      "Can still zero out irrelevant columns.",
      "Fast and interpretable.",
    ],
    limitations: [
      "Two settings (α and ρ) to tune.",
      "Linear relationships only.",
    ],
    settings: "Uses α = 0.1 and ρ = 0.5.",
  },
  bayesianRidge: {
    kind: "Bayesian Linear Model",
    summary:
      "A ridge-style regression where the amount of regularization is learned from the data by treating the weights as random variables with a prior.",
    purpose:
      "Use it when you want ridge regression without hand-tuning the penalty, especially on small datasets.",
    steps: [
      "Place a Gaussian prior on the weights and assume Gaussian noise.",
      "Estimate the noise precision α and weight precision λ by maximizing the evidence.",
      "Predict with the posterior mean of the weights.",
    ],
    formulas: [
      {
        label: "Prior and Likelihood",
        expression: "β ~ N(0, λ⁻¹I),   y | X, β ~ N(Xβ, α⁻¹I)",
      },
      {
        label: "Posterior Mean",
        expression: "β̂ = α · (αXᵀX + λI)⁻¹ Xᵀy",
      },
    ],
    strengths: [
      "Regularization strength tuned automatically.",
      "Robust on small datasets.",
      "Can report uncertainty in its predictions.",
    ],
    limitations: [
      "Linear relationships only.",
      "Slower than plain ridge on very large data.",
    ],
  },
  huber: {
    kind: "Robust Linear Model",
    summary:
      "A linear regression that treats small errors quadratically but large errors linearly, so a few extreme rows can't drag the line away.",
    purpose:
      "Use it when your target has outliers, such as data-entry mistakes or rare spikes, that you don't want to dominate the fit.",
    steps: [
      "Compute each row's residual (error).",
      "Square small residuals, but grow large ones only linearly.",
      "Find the weights that minimize this combined loss.",
    ],
    formulas: [
      {
        label: "Huber Loss",
        expression: "L_δ(r) = ½·r² if |r| ≤ δ,   otherwise δ·(|r| − ½·δ)",
        note: "r is the residual and δ is the point where the loss switches from squared to linear.",
      },
    ],
    strengths: [
      "Resistant to outliers.",
      "Still interpretable weights.",
      "Behaves like least squares on clean data.",
    ],
    limitations: [
      "Linear relationships only.",
      "Slower than ordinary least squares.",
    ],
    settings: "Uses ε = 1.35, the scikit-learn default.",
  },
  sgdRegressor: {
    kind: "Online Linear Model",
    summary:
      "Fits a linear model by stochastic gradient descent: it looks at one row at a time and nudges the weights to reduce that row's error.",
    purpose:
      "Built for very large datasets where computing an exact solution would be slow.",
    steps: [
      "Start with small random weights.",
      "For each row, compute the gradient of the loss.",
      "Step the weights a little in the opposite direction, repeating over many passes.",
    ],
    formulas: [
      {
        label: "Update Rule",
        expression: "β ← β − η · ∇L(β; xᵢ, yᵢ)",
        note: "η is the learning rate; the default loss is squared error with an L2 penalty.",
      },
    ],
    strengths: [
      "Scales to millions of rows.",
      "Low memory use.",
      "Works with streaming data.",
    ],
    limitations: [
      "Sensitive to feature scaling, so keep scaling on.",
      "Results can vary slightly between runs.",
    ],
  },
  sgdClassifier: {
    kind: "Online Linear Classifier",
    summary:
      "A linear classifier trained by stochastic gradient descent. With its default hinge loss it behaves like a linear support vector machine.",
    purpose:
      "Classifying very large datasets quickly, including text and other wide data.",
    steps: [
      "Start with small random weights.",
      "For each row, measure the hinge loss of its prediction.",
      "Nudge the weights to reduce that loss, over many passes.",
    ],
    formulas: [
      {
        label: "Hinge Loss",
        expression: "L = max(0, 1 − yᵢ · (wᵀxᵢ + b))",
      },
      {
        label: "Update Rule",
        expression: "w ← w − η · (∇L + α·w)",
      },
    ],
    strengths: [
      "Scales to huge datasets.",
      "Fast predictions.",
      "Memory efficient.",
    ],
    limitations: [
      "No probabilities with the default loss.",
      "Needs scaled features.",
    ],
  },
  theilSen: {
    kind: "Robust Linear Model",
    summary:
      "Estimates the line from the median of slopes computed on many small subsets of the data, which makes it very resistant to outliers.",
    purpose:
      "Use it on small to medium datasets where a portion of the rows may be corrupted.",
    steps: [
      "Draw many small subsets of rows.",
      "Fit a least-squares line to each subset.",
      "Combine them with a (spatial) median, which ignores extreme fits.",
    ],
    formulas: [
      {
        label: "One-Feature Case",
        expression: "slope = medianᵢ<ⱼ ( (yⱼ − yᵢ) ÷ (xⱼ − xᵢ) )",
      },
    ],
    strengths: [
      "Tolerates up to about 29% outliers.",
      "No assumptions about error distribution.",
    ],
    limitations: [
      "Slow as rows and columns grow.",
      "Loses efficiency on clean data.",
    ],
  },
  ransac: {
    kind: "Robust Linear Model",
    summary:
      "RANdom SAmple Consensus: repeatedly fits a model to random subsets and keeps the one that agrees with the most rows, treating the rest as outliers.",
    purpose:
      "Use it when a meaningful chunk of your data is simply wrong and should be ignored.",
    steps: [
      "Pick a small random subset and fit a linear model.",
      "Count inliers: rows whose error is below a threshold.",
      "Repeat, keep the model with the most inliers, and refit it on those inliers.",
    ],
    formulas: [
      {
        label: "Inlier Test",
        expression: "|yᵢ − ŷᵢ| < t",
        note: "By default t is the median absolute deviation of the target.",
      },
    ],
    strengths: [
      "Handles a very large share of outliers.",
      "Clearly separates inliers from outliers.",
    ],
    limitations: [
      "Random, so results can vary.",
      "Needs a good threshold to work well.",
    ],
  },
  decisionTree: {
    kind: "Tree-Based Model",
    summary:
      "Asks a sequence of yes/no questions about the inputs (for example, “petal length ≤ 2.45?”) and predicts from the group of training rows that ends up in the same leaf.",
    purpose:
      "An easy-to-explain model that captures non-linear rules and interactions without any scaling.",
    steps: [
      "Try every column and threshold to split the rows in two.",
      "Keep the split that makes the two groups most pure.",
      "Repeat on each group until leaves are pure or too small.",
    ],
    formulas: [TREE_SPLIT, GINI, MSE_IMPURITY],
    strengths: [
      "Readable as a flowchart.",
      "Needs no scaling and handles mixed data.",
      "Captures interactions automatically.",
    ],
    limitations: [
      "Overfits easily when grown deep.",
      "Small data changes can produce a very different tree.",
    ],
  },
  extraTree: {
    kind: "Tree-Based Model",
    summary:
      "A single extremely randomized tree: instead of searching for the best threshold, it tries random thresholds and keeps the best of those.",
    purpose:
      "Mainly a building block for Extra Trees ensembles; on its own it's a fast, high-variance learner.",
    steps: [
      "At each node, pick a random subset of columns.",
      "Draw a random threshold for each one.",
      "Keep whichever random split reduces impurity most.",
    ],
    formulas: [
      TREE_SPLIT,
      {
        label: "Random Threshold",
        expression: "t ~ Uniform(min(xⱼ), max(xⱼ))",
        note: "Drawn within the node for each candidate column j.",
      },
    ],
    strengths: [
      "Very fast to train.",
      "Adds useful diversity inside ensembles.",
    ],
    limitations: [
      "Noisy predictions when used alone.",
      "Overfits without an ensemble around it.",
    ],
  },
  randomForest: {
    kind: "Bagging Ensemble of Trees",
    summary:
      "Trains many decision trees, each on a random resample of rows and considering random subsets of columns, then averages their predictions or takes a vote.",
    purpose:
      "One of the most reliable all-round models for tabular data, with little tuning required.",
    steps: [
      "Draw a bootstrap sample of rows for each tree.",
      "Grow each tree, considering only a random subset of columns at each split.",
      "Average the trees (regression) or take a majority vote (classification).",
    ],
    formulas: [
      {
        label: "Regression",
        expression: "ŷ = (1 ÷ B) · Σ_b T_b(x)",
      },
      {
        label: "Classification",
        expression: "ŷ = mode{ T₁(x), T₂(x), …, T_B(x) }",
      },
      GINI,
    ],
    strengths: [
      "Strong accuracy out of the box.",
      "Resistant to overfitting and outliers.",
      "Provides feature importances.",
    ],
    limitations: [
      "Larger and slower than a single tree.",
      "Harder to interpret than one tree.",
    ],
    settings: "Uses 100 trees.",
  },
  extraTrees: {
    kind: "Randomized Ensemble of Trees",
    summary:
      "Like Random Forest, but split thresholds are chosen at random, which adds more diversity between trees and makes training faster.",
    purpose:
      "A quick, strong ensemble that often matches Random Forest with less variance.",
    steps: [
      "Grow many trees on the full training data.",
      "At each node, try random thresholds on random columns and keep the best.",
      "Average or vote across all trees.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = (1 ÷ B) · Σ_b T_b(x)",
      },
      {
        label: "Random Threshold",
        expression: "t ~ Uniform(min(xⱼ), max(xⱼ))",
      },
    ],
    strengths: [
      "Faster to train than Random Forest.",
      "Lower variance thanks to extra randomness.",
      "Provides feature importances.",
    ],
    limitations: [
      "Slightly higher bias than Random Forest.",
      "Large model size.",
    ],
    settings: "Uses 100 trees.",
  },
  bagging: {
    kind: "Bagging Ensemble",
    summary:
      "Bootstrap aggregating: trains the same base model (a decision tree by default) on many random resamples of the rows and combines their predictions.",
    purpose:
      "Reduces the variance of an unstable model such as a deep decision tree.",
    steps: [
      "Draw B bootstrap samples, each the size of the training set.",
      "Train one base model on each sample.",
      "Average (regression) or vote (classification).",
    ],
    formulas: [
      {
        label: "Aggregation",
        expression: "ŷ = (1 ÷ B) · Σ_b f_b(x)",
      },
    ],
    strengths: [
      "Stabilizes high-variance models.",
      "Works with any base model.",
      "Easy to parallelize.",
    ],
    limitations: [
      "Doesn't reduce bias.",
      "Usually slightly weaker than Random Forest.",
    ],
    settings: "Uses 50 decision trees.",
  },
  gradientBoosting: {
    kind: "Boosting Ensemble of Trees",
    summary:
      "Builds small trees one after another, where each new tree corrects the mistakes of all the trees before it.",
    purpose:
      "Among the most accurate models for tabular data when you can afford sequential training.",
    steps: [
      "Start from a constant prediction, such as the mean.",
      "Compute how wrong the current model is on each row (the gradient).",
      "Fit a small tree to those errors and add it, scaled by the learning rate.",
    ],
    formulas: [BOOSTING_UPDATE, PSEUDO_RESIDUAL],
    strengths: [
      "Excellent accuracy on structured data.",
      "Flexible loss functions.",
      "Provides feature importances.",
    ],
    limitations: [
      "Trains sequentially, so it's slower.",
      "Can overfit without enough regularization.",
    ],
    settings: "Uses 100 trees with learning rate 0.1 and depth 3.",
  },
  histGradientBoosting: {
    kind: "Histogram Boosting Ensemble",
    summary:
      "Gradient boosting that first buckets each column into at most 256 bins, making split finding dramatically faster on large data. It also handles missing values natively.",
    purpose:
      "Fast, accurate boosting for datasets with tens of thousands of rows or more.",
    steps: [
      "Bin every numeric column into histograms.",
      "Find splits by scanning bin boundaries instead of every value.",
      "Add trees sequentially, each correcting the current errors.",
    ],
    formulas: [BOOSTING_UPDATE, PSEUDO_RESIDUAL],
    strengths: [
      "Very fast on large datasets.",
      "Supports missing values without imputation.",
      "Built-in early stopping on big data.",
    ],
    limitations: [
      "Binning can lose fine detail on tiny datasets.",
      "Less interpretable than a single tree.",
    ],
  },
  adaboost: {
    kind: "Boosting Ensemble",
    summary:
      "Adaptive Boosting trains weak learners in sequence, giving more weight to the rows the previous learners got wrong.",
    purpose:
      "A classic boosting method that turns many simple models into a strong one.",
    steps: [
      "Give every row the same weight.",
      "Train a weak learner and measure its weighted error ε.",
      "Increase the weight of misclassified rows, give the learner a say α, and repeat.",
    ],
    formulas: [
      {
        label: "Final Model",
        expression: "F(x) = Σₘ αₘ · hₘ(x)",
      },
      {
        label: "Learner Weight",
        expression: "αₘ = ln((1 − εₘ) ÷ εₘ) + ln(K − 1)",
        note: "The discrete SAMME rule for K classes. This app's classifier uses SAMME.R, which combines class probabilities instead; regression uses AdaBoost.R2, which reweights rows by error size.",
      },
      {
        label: "Row Reweighting",
        expression: "wᵢ ← wᵢ · exp(αₘ · 𝟙[yᵢ ≠ hₘ(xᵢ)])",
      },
    ],
    strengths: ["Simple and effective.", "Focuses on hard examples."],
    limitations: [
      "Sensitive to noisy labels and outliers.",
      "Usually beaten by gradient boosting.",
    ],
    settings: "Uses 100 learners.",
  },
  xgboost: {
    kind: "Regularized Gradient Boosting",
    summary:
      "eXtreme Gradient Boosting: gradient-boosted trees with second-order optimization and built-in penalties on tree complexity.",
    purpose:
      "A competition-winning model for tabular data when you want top accuracy.",
    steps: [
      "Compute the first (g) and second (h) derivatives of the loss for every row.",
      "Grow trees using a gain formula that rewards error reduction and penalizes complexity.",
      "Add each tree with shrinkage, repeating for the set number of rounds.",
    ],
    formulas: [
      {
        label: "Objective",
        expression: "Σᵢ L(yᵢ, ŷᵢ) + Σₖ Ω(fₖ),   Ω(f) = γ·T + ½·λ·‖w‖²",
        note: "T is the number of leaves and w the leaf weights.",
      },
      {
        label: "Optimal Leaf Weight",
        expression: "w* = −G ÷ (H + λ)",
        note: "G and H are the sums of gradients and Hessians in the leaf.",
      },
      {
        label: "Split Gain",
        expression:
          "Gain = ½·[G_L² ÷ (H_L + λ) + G_R² ÷ (H_R + λ) − (G_L + G_R)² ÷ (H_L + H_R + λ)] − γ",
      },
    ],
    strengths: [
      "State-of-the-art accuracy on tables.",
      "Strong built-in regularization.",
      "Handles missing values.",
    ],
    limitations: [
      "Many settings to tune for peak results.",
      "Less interpretable.",
    ],
    settings: "Uses 100 boosting rounds.",
  },
  lightgbm: {
    kind: "Histogram Gradient Boosting",
    summary:
      "Microsoft's LightGBM grows trees leaf by leaf (always splitting the leaf with the largest gain) on histogram-binned data, which makes it extremely fast.",
    purpose: "Top-tier accuracy with fast training on large datasets.",
    steps: [
      "Bin features into histograms.",
      "Grow each tree leaf-wise, splitting whichever leaf reduces the loss most.",
      "Add trees sequentially with shrinkage.",
    ],
    formulas: [
      BOOSTING_UPDATE,
      {
        label: "Leaf-Wise Growth",
        expression: "split leaf* = argmax over leaves of Gain(leaf)",
      },
    ],
    strengths: [
      "Very fast and memory efficient.",
      "Excellent accuracy.",
      "Handles large data and many features.",
    ],
    limitations: [
      "Can overfit small datasets.",
      "Deep, lopsided trees are harder to read.",
    ],
    settings: "Uses 100 boosting rounds.",
  },
  catboost: {
    kind: "Ordered Gradient Boosting",
    summary:
      "Yandex's CatBoost uses symmetric (oblivious) trees and ordered boosting, which reduces a subtle form of target leakage and handles categories well.",
    purpose:
      "Strong accuracy with minimal tuning, especially when data has text categories.",
    steps: [
      "Process rows in a random order so each row's statistics only use earlier rows.",
      "Grow symmetric trees that apply the same split across a whole level.",
      "Add trees sequentially, each reducing the remaining error.",
    ],
    formulas: [
      BOOSTING_UPDATE,
      {
        label: "Ordered Target Statistic",
        expression: "TS(c) = (Σⱼ₍ⱼ<ᵢ, cⱼ = c₎ yⱼ + a·p) ÷ (count + a)",
        note: "Encodes a category using only earlier rows, with prior p and weight a.",
      },
    ],
    strengths: [
      "Great defaults, little tuning needed.",
      "Resists overfitting.",
      "Fast predictions from symmetric trees.",
    ],
    limitations: ["Slower to train than LightGBM.", "Large model files."],
    settings: "Uses 100 iterations.",
  },
  stackingReg: {
    kind: "Stacked Ensemble",
    summary:
      "Trains several different base models, then trains a meta-model that learns how best to combine their predictions.",
    purpose:
      "Squeezes extra accuracy by letting different kinds of models cover each other's weaknesses.",
    steps: [
      "Train the base models (Linear Regression and a depth-5 Decision Tree).",
      "Collect their out-of-fold predictions with 5-fold cross-validation.",
      "Train a Ridge meta-model on those predictions.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = g( f₁(x), f₂(x), …, fₖ(x) )",
        note: "g is the meta-model and fⱼ are the base models.",
      },
    ],
    strengths: [
      "Often beats every base model alone.",
      "Combines very different model types.",
    ],
    limitations: [
      "Slow: trains every base model several times.",
      "Hard to interpret.",
    ],
    settings:
      "Base models: Linear Regression and Decision Tree. Meta-model: Ridge.",
  },
  stackingClf: {
    kind: "Stacked Ensemble",
    summary:
      "Trains several different base classifiers, then trains a meta-classifier on their predicted probabilities to make the final decision.",
    purpose: "Combines complementary models for extra accuracy.",
    steps: [
      "Train the base models (Logistic Regression and a depth-5 Decision Tree).",
      "Collect their out-of-fold predictions with 5-fold cross-validation.",
      "Train a Logistic Regression meta-model on those predictions.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = g( P₁(y | x), P₂(y | x), …, Pₖ(y | x) )",
      },
    ],
    strengths: [
      "Often beats every base model alone.",
      "Learns which model to trust when.",
    ],
    limitations: ["Slow to train.", "Hard to interpret."],
    settings:
      "Base models: Logistic Regression and Decision Tree. Meta-model: Logistic Regression.",
  },
  votingReg: {
    kind: "Voting Ensemble",
    summary:
      "Averages the predictions of several different regressors with equal weight.",
    purpose: "A simple way to smooth out the errors of individual models.",
    steps: [
      "Train each base model independently.",
      "Average their predictions.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = (1 ÷ k) · Σⱼ fⱼ(x)",
      },
    ],
    strengths: ["Simple and robust.", "Reduces variance."],
    limitations: [
      "Can't learn which model is better.",
      "Only as good as its members.",
    ],
    settings: "Members: Linear Regression and Decision Tree.",
  },
  votingHard: {
    kind: "Voting Ensemble",
    summary:
      "Each member classifier votes for a class, and the class with the most votes wins.",
    purpose: "A simple, robust way to combine different classifiers.",
    steps: [
      "Train each member independently.",
      "Collect one predicted class from each.",
      "Predict the most common class.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = mode{ f₁(x), f₂(x), …, fₖ(x) }",
      },
    ],
    strengths: ["Simple and stable.", "No probabilities needed."],
    limitations: [
      "Ignores how confident each model is.",
      "Ties are broken by class order.",
    ],
    settings: "Members: Logistic Regression and Decision Tree.",
  },
  votingSoft: {
    kind: "Voting Ensemble",
    summary:
      "Averages the class probabilities from each member and predicts the class with the highest average probability.",
    purpose: "Combines classifiers while respecting how confident each one is.",
    steps: [
      "Train each member independently.",
      "Average their predicted probabilities for every class.",
      "Predict the class with the highest average.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = argmax_c (1 ÷ k) · Σⱼ Pⱼ(c | x)",
      },
    ],
    strengths: [
      "Usually beats hard voting.",
      "Uses confidence, not just labels.",
    ],
    limitations: ["Needs well-calibrated probabilities."],
    settings: "Members: Logistic Regression, Decision Tree, and Random Forest.",
  },
  svr: {
    kind: "Kernel Support Vector Machine",
    summary:
      "Finds a smooth function that keeps most predictions within ±ε of the truth, using a kernel to model curved relationships.",
    purpose:
      "Accurate regression on small to medium datasets with non-linear patterns.",
    steps: [
      "Map the inputs into a high-dimensional space via the RBF kernel.",
      "Ignore errors smaller than ε; penalize larger ones.",
      "Keep the function as flat as possible while fitting the data.",
    ],
    formulas: [
      {
        label: "ε-Insensitive Loss",
        expression: "L = max(0, |y − f(x)| − ε)",
      },
      {
        label: "Prediction",
        expression: "f(x) = Σᵢ (αᵢ − αᵢ*) · K(xᵢ, x) + b",
      },
      RBF_KERNEL,
    ],
    strengths: [
      "Captures complex curves.",
      "Robust to small noise.",
      "Effective in high dimensions.",
    ],
    limitations: [
      "Slow beyond tens of thousands of rows.",
      "Requires feature scaling.",
    ],
    settings: "Uses the RBF kernel with C = 1.0.",
  },
  linearSvr: {
    kind: "Linear Support Vector Machine",
    summary:
      "A linear regression trained with the ε-insensitive loss of support vector machines, fast even on large data.",
    purpose:
      "Linear regression that is less sensitive to small errors and scales well.",
    steps: [
      "Fit a straight-line function.",
      "Ignore errors smaller than ε.",
      "Balance flatness against larger errors with C.",
    ],
    formulas: [
      {
        label: "Objective",
        expression: "minimize ½·‖w‖² + C · Σᵢ max(0, |yᵢ − (wᵀxᵢ + b)| − ε)",
      },
    ],
    strengths: ["Fast on large datasets.", "Robust to small noise."],
    limitations: ["Linear relationships only.", "Needs scaling."],
  },
  nuSvr: {
    kind: "Kernel Support Vector Machine",
    summary:
      "A variant of SVR where ν sets an upper bound on the fraction of errors and a lower bound on the fraction of support vectors.",
    purpose:
      "Kernel regression when you'd rather control model complexity through ν than ε.",
    steps: [
      "Map inputs via the RBF kernel.",
      "Let ν decide how wide the error-free tube should be.",
      "Solve for the flattest function that fits.",
    ],
    formulas: [
      {
        label: "Objective",
        expression: "minimize ½·‖w‖² + C·(ν·ε + (1 ÷ n)·Σᵢ (ξᵢ + ξᵢ*))",
      },
      RBF_KERNEL,
    ],
    strengths: [
      "Intuitive control over support vectors.",
      "Captures non-linear patterns.",
    ],
    limitations: ["Slow on large data.", "Requires scaling."],
    settings: "Uses the RBF kernel with ν = 0.5.",
  },
  svc: {
    kind: "Kernel Support Vector Machine",
    summary:
      "Finds the boundary that separates classes with the widest possible margin, using a kernel to draw curved boundaries.",
    purpose:
      "Accurate classification on small to medium datasets with complex boundaries.",
    steps: [
      "Map the inputs into a high-dimensional space via the RBF kernel.",
      "Find the separating boundary with the maximum margin.",
      "Allow some violations, penalized by C.",
    ],
    formulas: [
      {
        label: "Objective",
        expression:
          "minimize ½·‖w‖² + C · Σᵢ ξᵢ   subject to   yᵢ·(wᵀφ(xᵢ) + b) ≥ 1 − ξᵢ",
      },
      {
        label: "Decision Function",
        expression: "f(x) = sign( Σᵢ αᵢ·yᵢ·K(xᵢ, x) + b )",
      },
      RBF_KERNEL,
    ],
    strengths: [
      "Powerful non-linear boundaries.",
      "Effective in high dimensions.",
      "Only the support vectors matter.",
    ],
    limitations: ["Slow on large datasets.", "Requires feature scaling."],
    settings: "Uses the RBF kernel with C = 1.0 and probability estimates on.",
  },
  linearSvc: {
    kind: "Linear Support Vector Machine",
    summary:
      "Finds a straight-line (hyperplane) boundary between classes with the widest possible margin.",
    purpose:
      "Fast, strong linear classification, especially with many features.",
    steps: [
      "Fit a linear boundary.",
      "Penalize rows on the wrong side of the margin.",
      "Balance margin width against violations with C.",
    ],
    formulas: [
      {
        label: "Objective (Squared Hinge)",
        expression: "minimize ½·‖w‖² + C · Σᵢ max(0, 1 − yᵢ·(wᵀxᵢ + b))²",
      },
    ],
    strengths: ["Fast on large, wide data.", "Robust margin-based boundary."],
    limitations: ["Linear boundaries only.", "No probabilities."],
  },
  nuSvc: {
    kind: "Kernel Support Vector Machine",
    summary:
      "A support vector classifier where ν bounds the fraction of margin errors and support vectors instead of using C.",
    purpose: "Kernel classification with an intuitive complexity control.",
    steps: [
      "Map inputs via the RBF kernel.",
      "Let ν control how many rows may sit inside the margin.",
      "Find the widest-margin boundary under that constraint.",
    ],
    formulas: [
      {
        label: "Objective",
        expression:
          "minimize ½·‖w‖² − ν·ρ + (1 ÷ n)·Σᵢ ξᵢ   subject to   yᵢ·(wᵀφ(xᵢ) + b) ≥ ρ − ξᵢ",
      },
      RBF_KERNEL,
    ],
    strengths: ["Intuitive ν parameter.", "Non-linear boundaries."],
    limitations: [
      "Slow on large data.",
      "Some ν values are infeasible for imbalanced classes.",
    ],
    settings: "Uses ν = 0.5 with probability estimates on.",
  },
  knnReg: {
    kind: "Instance-Based Model",
    summary:
      "Predicts by finding the k training rows closest to the new row and averaging their targets. There's no training phase; the data is the model.",
    purpose: "A simple, flexible model when similar rows have similar targets.",
    steps: [
      "Store all training rows.",
      "For a new row, find the k nearest rows by distance.",
      "Average their target values.",
    ],
    formulas: [
      EUCLIDEAN,
      {
        label: "Prediction",
        expression: "ŷ = (1 ÷ k) · Σ_{i ∈ N_k(x)} yᵢ",
      },
    ],
    strengths: [
      "No assumptions about the data's shape.",
      "Easy to understand.",
    ],
    limitations: [
      "Slow predictions on large data.",
      "Needs scaling and suffers with many columns.",
    ],
    settings: "Uses k = 5.",
  },
  knnClf: {
    kind: "Instance-Based Model",
    summary:
      "Classifies a new row by a majority vote of its k nearest training rows.",
    purpose: "A simple, intuitive classifier when similar rows share a class.",
    steps: [
      "Store all training rows.",
      "For a new row, find the k nearest rows by distance.",
      "Predict the most common class among them.",
    ],
    formulas: [
      EUCLIDEAN,
      {
        label: "Prediction",
        expression: "ŷ = mode{ yᵢ : i ∈ N_k(x) }",
      },
    ],
    strengths: ["Flexible, curved boundaries.", "No training time."],
    limitations: [
      "Slow predictions on large data.",
      "Needs scaling; sensitive to irrelevant columns.",
    ],
    settings: "Uses k = 5.",
  },
  mlpReg: {
    kind: "Neural Network",
    summary:
      "A multi-layer perceptron: layers of connected neurons that transform the inputs step by step, learning weights by backpropagation.",
    purpose:
      "Models complex, non-linear relationships when you have enough rows.",
    steps: [
      "Pass inputs through two hidden layers (100 and 50 neurons) with ReLU activations.",
      "Measure the squared error of the output.",
      "Backpropagate the error and update weights with the Adam optimizer.",
    ],
    formulas: [
      {
        label: "Hidden Layer",
        expression: "h = ReLU(W·x + b),   ReLU(z) = max(0, z)",
      },
      {
        label: "Output",
        expression: "ŷ = W_out·h + b_out",
      },
      {
        label: "Weight Update",
        expression: "w ← w − η · ∂L ÷ ∂w",
      },
    ],
    strengths: ["Learns very complex patterns.", "Scales with more data."],
    limitations: [
      "Needs scaling and more data.",
      "Hard to interpret; results vary with settings.",
    ],
    settings: "Hidden layers: 100 and 50 neurons, up to 500 iterations.",
  },
  mlpClf: {
    kind: "Neural Network",
    summary:
      "A multi-layer perceptron classifier: stacked layers of neurons ending in a softmax that turns scores into class probabilities.",
    purpose: "Captures complex, non-linear class boundaries.",
    steps: [
      "Pass inputs through two hidden layers (100 and 50 neurons) with ReLU.",
      "Convert the final scores into probabilities with softmax.",
      "Minimize cross-entropy with backpropagation and Adam.",
    ],
    formulas: [
      {
        label: "Hidden Layer",
        expression: "h = ReLU(W·x + b)",
      },
      {
        label: "Softmax Output",
        expression: "P(y = k | x) = e^{zₖ} ÷ Σⱼ e^{zⱼ}",
      },
      {
        label: "Cross-Entropy Loss",
        expression: "L = −Σₖ yₖ · log P(y = k | x)",
      },
    ],
    strengths: ["Flexible, powerful boundaries.", "Gives probabilities."],
    limitations: ["Needs scaling and tuning.", "Hard to interpret."],
    settings: "Hidden layers: 100 and 50 neurons, up to 500 iterations.",
  },
  gpReg: {
    kind: "Probabilistic Kernel Model",
    summary:
      "Treats the unknown function as a Gaussian process: a distribution over smooth functions. It predicts both a value and how uncertain that value is.",
    purpose:
      "Small datasets where you care about uncertainty as much as the prediction.",
    steps: [
      "Define how similar two rows are with a kernel.",
      "Condition the Gaussian process on the training data.",
      "Read off the predictive mean and variance for new rows.",
    ],
    formulas: [
      {
        label: "Prior",
        expression: "f ~ GP(0, k(x, x′))",
      },
      {
        label: "Predictive Mean",
        expression: "μ(x*) = k*ᵀ · (K + σₙ²I)⁻¹ · y",
      },
      {
        label: "Predictive Variance",
        expression: "σ²(x*) = k(x*, x*) − k*ᵀ · (K + σₙ²I)⁻¹ · k*",
      },
    ],
    strengths: [
      "Built-in uncertainty estimates.",
      "Excellent on small, smooth problems.",
    ],
    limitations: [
      "Cost grows with n³, so it's limited to a few thousand rows here.",
      "Kernel choice matters.",
    ],
  },
  gpClf: {
    kind: "Probabilistic Kernel Model",
    summary:
      "Places a Gaussian process on a hidden score and squashes it through a sigmoid to get class probabilities.",
    purpose:
      "Small classification problems where calibrated probabilities matter.",
    steps: [
      "Model a latent function f with a Gaussian process.",
      "Map f to probabilities with the logistic function.",
      "Approximate the posterior with the Laplace method.",
    ],
    formulas: [
      {
        label: "Class Probability",
        expression: "P(y = 1 | x) = σ(f(x)) = 1 ÷ (1 + e^{−f(x)})",
      },
      {
        label: "Latent Prior",
        expression: "f ~ GP(0, k(x, x′))",
      },
    ],
    strengths: ["Well-calibrated probabilities.", "Flexible boundaries."],
    limitations: [
      "Limited to a few thousand rows here.",
      "Multi-class uses one-vs-rest, which is slower.",
    ],
  },
  logistic: {
    kind: "Linear Classifier",
    summary:
      "Computes a weighted sum of the inputs and converts it into a probability with the logistic (sigmoid) function, or softmax for more than two classes.",
    purpose:
      "The standard, interpretable baseline for classification that also gives probabilities.",
    steps: [
      "Weight each input and add them up into a score.",
      "Turn the score into a probability with the sigmoid or softmax.",
      "Find weights that maximize the likelihood of the true labels, with L2 regularization.",
    ],
    formulas: [
      {
        label: "Probability (Binary)",
        expression: "P(y = 1 | x) = 1 ÷ (1 + e^{−(β₀ + βᵀx)})",
      },
      {
        label: "Log Loss",
        expression:
          "L = −Σᵢ [ yᵢ·log pᵢ + (1 − yᵢ)·log(1 − pᵢ) ] + (1 ÷ 2C)·‖β‖²",
      },
    ],
    strengths: [
      "Fast and interpretable.",
      "Well-calibrated probabilities.",
      "Rarely overfits with regularization.",
    ],
    limitations: ["Linear boundaries only.", "Needs scaling for best results."],
    settings: "Uses C = 1.0 and up to 1,000 iterations.",
  },
  perceptron: {
    kind: "Linear Classifier",
    summary:
      "The original neural unit (Rosenblatt, 1958): it predicts with the sign of a weighted sum and updates its weights only when it makes a mistake.",
    purpose:
      "A fast, simple online classifier and a useful historical baseline.",
    steps: [
      "Predict the sign of wᵀx + b.",
      "If the prediction is wrong, move the weights toward the correct class.",
      "Repeat over the data until mistakes stop or iterations run out.",
    ],
    formulas: [
      {
        label: "Prediction",
        expression: "ŷ = sign(wᵀx + b)",
      },
      {
        label: "Update on Mistake",
        expression: "w ← w + η · yᵢ · xᵢ",
      },
    ],
    strengths: ["Extremely fast.", "Works online, row by row."],
    limitations: [
      "Only converges on perfectly separable data.",
      "No probabilities.",
    ],
  },
  passiveAggressive: {
    kind: "Online Linear Classifier",
    summary:
      "Stays passive when a row is classified correctly with enough margin, and aggressively updates just enough to fix it when it isn't.",
    purpose: "Large-scale or streaming classification, including text.",
    steps: [
      "Compute the hinge loss of the current row.",
      "If the loss is zero, do nothing.",
      "Otherwise, update the weights by the smallest step that fixes the mistake (capped by C).",
    ],
    formulas: [
      {
        label: "Loss",
        expression: "ℓ = max(0, 1 − yᵢ · wᵀxᵢ)",
      },
      {
        label: "Update",
        expression: "w ← w + τ · yᵢ · xᵢ,   τ = min(C, ℓ ÷ ‖xᵢ‖²)",
      },
    ],
    strengths: ["Fast and memory efficient.", "Adapts to new data quickly."],
    limitations: ["Sensitive to noisy labels.", "No probabilities."],
  },
  gaussianNb: {
    kind: "Probabilistic Classifier",
    summary:
      "Applies Bayes' theorem, assuming each numeric column follows a bell curve within each class and that columns are independent given the class.",
    purpose:
      "A lightning-fast baseline that works surprisingly well on small data.",
    steps: [
      "Estimate each class's share of the data (the prior).",
      "Estimate a mean and variance for every column within every class.",
      "Predict the class with the highest posterior probability.",
    ],
    formulas: [
      {
        label: "Bayes' Rule",
        expression: "P(c | x) ∝ P(c) · Πⱼ P(xⱼ | c)",
      },
      {
        label: "Gaussian Likelihood",
        expression:
          "P(xⱼ | c) = (1 ÷ √(2π·σ²_cj)) · exp(−(xⱼ − μ_cj)² ÷ (2σ²_cj))",
      },
    ],
    strengths: [
      "Trains instantly.",
      "Works with very little data.",
      "Gives probabilities.",
    ],
    limitations: [
      "Assumes independent, bell-shaped columns.",
      "Probabilities can be overconfident.",
    ],
  },
  bernoulliNb: {
    kind: "Probabilistic Classifier",
    summary:
      "A naive Bayes model for yes/no features. Each column is binarized (above or below 0, which after standard scaling means above or below average).",
    purpose:
      "Classifying binary or presence/absence data, such as word occurrence.",
    steps: [
      "Binarize each column at a threshold.",
      "Estimate how often each column is “on” within each class.",
      "Combine with Bayes' rule and pick the most probable class.",
    ],
    formulas: [
      {
        label: "Likelihood",
        expression: "P(x | c) = Πⱼ p_cjˣʲ · (1 − p_cj)^(1 − xⱼ)",
      },
      {
        label: "Posterior",
        expression: "P(c | x) ∝ P(c) · P(x | c)",
      },
    ],
    strengths: ["Very fast.", "Good for binary or text features."],
    limitations: [
      "Throws away magnitude information.",
      "Assumes independent columns.",
    ],
  },
  complementNb: {
    kind: "Probabilistic Classifier",
    summary:
      "A naive Bayes variant that learns from the complement of each class (all the other classes), which makes it more stable on imbalanced data.",
    purpose:
      "Imbalanced classification, especially with count-like features such as word frequencies.",
    steps: [
      "Rescale inputs to 0–1 so every value is non-negative (added automatically).",
      "For each class, estimate feature weights from all rows not in that class.",
      "Predict the class whose complement fits the row worst.",
    ],
    formulas: [
      {
        label: "Complement Estimate",
        expression: "θ̂_cj = (α + Σ_{y≠c} xⱼ) ÷ (α·n + Σ_{y≠c} Σₖ xₖ)",
      },
      {
        label: "Prediction",
        expression: "ŷ = argmin_c Σⱼ xⱼ · log θ̂_cj",
      },
    ],
    strengths: ["Handles class imbalance well.", "Very fast."],
    limitations: [
      "Designed for count data; weaker on continuous measurements.",
      "Assumes independent columns.",
    ],
    settings: "Includes a clipped min-max rescaling step so any scaler works.",
  },
  lda: {
    kind: "Discriminant Analysis",
    summary:
      "Models each class as a bell curve that shares one common covariance, which produces straight-line boundaries between classes.",
    purpose:
      "A fast, stable classifier that also works as a dimensionality reducer.",
    steps: [
      "Estimate each class's mean and a shared covariance matrix.",
      "Compute a linear score for each class.",
      "Predict the class with the highest score.",
    ],
    formulas: [
      {
        label: "Discriminant Score",
        expression: "δₖ(x) = xᵀΣ⁻¹μₖ − ½·μₖᵀΣ⁻¹μₖ + log πₖ",
      },
    ],
    strengths: [
      "Fast with a closed-form solution.",
      "Stable on small datasets.",
      "Gives probabilities.",
    ],
    limitations: [
      "Assumes bell-shaped classes with equal spread.",
      "Linear boundaries only.",
    ],
  },
  qda: {
    kind: "Discriminant Analysis",
    summary:
      "Like LDA, but each class gets its own covariance, so boundaries between classes can curve.",
    purpose:
      "Classes with different spreads or shapes, when you have enough rows per class.",
    steps: [
      "Estimate a mean and covariance for every class.",
      "Compute a quadratic score for each class.",
      "Predict the class with the highest score.",
    ],
    formulas: [
      {
        label: "Discriminant Score",
        expression: "δₖ(x) = −½·log|Σₖ| − ½·(x − μₖ)ᵀΣₖ⁻¹(x − μₖ) + log πₖ",
      },
    ],
    strengths: ["Curved boundaries.", "Fast and probabilistic."],
    limitations: [
      "Needs many rows per class.",
      "Unstable with correlated columns.",
    ],
  },
  kmeans: {
    kind: "Centroid-Based Clustering",
    summary:
      "Splits the rows into k groups by repeatedly assigning each row to its nearest center and moving each center to the middle of its rows.",
    purpose: "Fast segmentation into compact, roughly round groups.",
    steps: [
      "Place k centers (k-means++ spreads them out).",
      "Assign every row to its nearest center.",
      "Move each center to the mean of its rows; repeat until stable.",
    ],
    formulas: [
      {
        label: "Objective (Inertia)",
        expression: "minimize Σₖ Σ_{x ∈ Cₖ} ‖x − μₖ‖²",
      },
      {
        label: "Center Update",
        expression: "μₖ = (1 ÷ |Cₖ|) · Σ_{x ∈ Cₖ} x",
      },
    ],
    strengths: ["Fast and scalable.", "Simple to explain."],
    limitations: [
      "You must choose k.",
      "Struggles with odd shapes and uneven sizes.",
    ],
    settings: "Finds 3 clusters, best of 10 starts.",
  },
  miniBatchKmeans: {
    kind: "Centroid-Based Clustering",
    summary:
      "K-Means that updates centers from small random batches of rows, trading a little accuracy for a big speedup.",
    purpose: "Clustering very large datasets quickly.",
    steps: [
      "Draw a small random batch of rows.",
      "Assign them to their nearest centers.",
      "Nudge each center toward its batch rows with a decreasing step.",
    ],
    formulas: [
      {
        label: "Center Update",
        expression: "μₖ ← (1 − η)·μₖ + η·x,   η = 1 ÷ countₖ",
      },
    ],
    strengths: ["Much faster than K-Means.", "Low memory use."],
    limitations: ["Slightly worse clusters.", "You must choose k."],
    settings: "Finds 3 clusters.",
  },
  dbscan: {
    kind: "Density-Based Clustering",
    summary:
      "Groups rows that sit in dense neighborhoods and labels isolated rows as noise. It finds the number of clusters on its own.",
    purpose: "Clusters of any shape, with automatic outlier detection.",
    steps: [
      "Mark a row as core if at least minPts rows lie within distance ε.",
      "Connect core rows that are within ε of each other into clusters.",
      "Attach nearby border rows; everything else is noise (−1).",
    ],
    formulas: [
      {
        label: "Core Point",
        expression: "|N_ε(x)| ≥ minPts,   N_ε(x) = { y : d(x, y) ≤ ε }",
      },
    ],
    strengths: [
      "No need to choose the number of clusters.",
      "Finds odd shapes and flags outliers.",
    ],
    limitations: [
      "One ε can't fit clusters of different densities.",
      "Sensitive to scaling.",
    ],
    settings: "Uses ε = 0.5 and minPts = 5.",
  },
  meanShift: {
    kind: "Centroid-Based Clustering",
    summary:
      "Moves every point uphill toward the densest area around it. Points that end up at the same peak form a cluster.",
    purpose:
      "Finding clusters without choosing how many, for smooth blob-like groups.",
    steps: [
      "Estimate density with a kernel of a chosen bandwidth.",
      "Shift each candidate center to the weighted mean of its neighbors.",
      "Merge centers that converge to the same peak.",
    ],
    formulas: [
      {
        label: "Mean Shift Step",
        expression: "m(x) = Σᵢ K(xᵢ − x)·xᵢ ÷ Σᵢ K(xᵢ − x)",
      },
    ],
    strengths: [
      "Chooses the number of clusters itself.",
      "No shape assumptions.",
    ],
    limitations: ["Slow on large data.", "Results depend on the bandwidth."],
    settings: "Bandwidth is estimated from the data.",
  },
  gaussianMixture: {
    kind: "Probabilistic Clustering",
    summary:
      "Assumes the data comes from a mix of k bell curves and learns their centers, shapes, and weights. Every row gets a probability for each cluster.",
    purpose: "Soft clustering of elliptical groups that may overlap.",
    steps: [
      "Initialize k Gaussian components.",
      "E-step: compute how responsible each component is for each row.",
      "M-step: update means, covariances, and weights; repeat.",
    ],
    formulas: [
      {
        label: "Mixture Density",
        expression: "p(x) = Σₖ πₖ · N(x | μₖ, Σₖ)",
      },
      {
        label: "Responsibility",
        expression: "γᵢₖ = πₖ·N(xᵢ | μₖ, Σₖ) ÷ Σⱼ πⱼ·N(xᵢ | μⱼ, Σⱼ)",
      },
    ],
    strengths: [
      "Soft, probabilistic assignments.",
      "Handles elliptical, overlapping clusters.",
    ],
    limitations: [
      "You must choose k.",
      "Can converge to a poor local optimum.",
    ],
    settings: "Finds 3 components.",
  },
  agglomerative: {
    kind: "Hierarchical Clustering",
    summary:
      "Starts with every row as its own cluster and repeatedly merges the two closest clusters, building a tree of merges.",
    purpose: "Understanding nested group structure; works with any distance.",
    steps: [
      "Treat every row as its own cluster.",
      "Merge the pair whose merge increases within-cluster variance least (Ward linkage).",
      "Stop when k clusters remain.",
    ],
    formulas: [
      {
        label: "Ward Merge Cost",
        expression: "Δ(A, B) = (n_A·n_B ÷ (n_A + n_B)) · ‖μ_A − μ_B‖²",
      },
    ],
    strengths: ["Reveals a full hierarchy.", "Deterministic results."],
    limitations: [
      "Memory and time grow quickly with rows.",
      "Merges can't be undone.",
    ],
    settings: "Finds 3 clusters with Ward linkage.",
  },
  birch: {
    kind: "Hierarchical Clustering",
    summary:
      "Compresses the data into a tree of small summaries called clustering features, then clusters those summaries. Built for large datasets.",
    purpose: "Memory-efficient clustering of large data in a single pass.",
    steps: [
      "Insert rows into a CF-tree, merging them into nearby subclusters.",
      "Each subcluster stores only its count, sum, and sum of squares.",
      "Cluster the subclusters into the final k groups.",
    ],
    formulas: [
      {
        label: "Clustering Feature",
        expression: "CF = (N, LS, SS) = (count, Σ x, Σ ‖x‖²)",
      },
      {
        label: "Centroid and Radius",
        expression: "μ = LS ÷ N,   R = √(SS ÷ N − ‖μ‖²)",
      },
    ],
    strengths: ["Fast, single pass.", "Low memory use."],
    limitations: [
      "Favors round clusters.",
      "Sensitive to the threshold setting.",
    ],
    settings: "Finds 3 clusters.",
  },
  spectral: {
    kind: "Graph-Based Clustering",
    summary:
      "Builds a similarity graph between rows and uses the eigenvectors of its Laplacian to find clusters, which lets it separate intertwined shapes.",
    purpose:
      "Non-convex clusters, such as rings or spirals, on small to medium data.",
    steps: [
      "Build an affinity matrix W of pairwise similarities.",
      "Compute the graph Laplacian and its leading eigenvectors.",
      "Cluster rows in that eigenvector space.",
    ],
    formulas: [
      {
        label: "Normalized Laplacian",
        expression: "L = I − D^{−½} · W · D^{−½}",
        note: "D is the diagonal degree matrix of W.",
      },
    ],
    strengths: [
      "Finds complex, non-convex shapes.",
      "Strong theoretical grounding.",
    ],
    limitations: [
      "Expensive on large data (limited here).",
      "You must choose k.",
    ],
    settings: "Finds 3 clusters with discretized label assignment.",
  },
  optics: {
    kind: "Density-Based Clustering",
    summary:
      "Orders points by how reachable they are from dense regions, then extracts clusters from that ordering. It handles clusters with different densities.",
    purpose:
      "Density-based clustering when one DBSCAN radius can't fit every cluster.",
    steps: [
      "Compute each point's core distance (distance to its minPts-th neighbor).",
      "Visit points in order of reachability distance.",
      "Cut the reachability plot into clusters at steep drops.",
    ],
    formulas: [
      {
        label: "Reachability Distance",
        expression: "r(p, o) = max( core_dist(o), d(o, p) )",
      },
    ],
    strengths: ["Handles varying densities.", "Flags noise points."],
    limitations: ["Slower than DBSCAN.", "Limited to 20,000 rows here."],
    settings: "Uses minPts = 5.",
  },
  affinityPropagation: {
    kind: "Message-Passing Clustering",
    summary:
      "Rows send messages to each other about how well suited each one is to be an exemplar (a representative), until a set of exemplars emerges.",
    purpose:
      "Finding representative examples without choosing the number of clusters.",
    steps: [
      "Compute similarities between all pairs of rows.",
      "Exchange responsibility and availability messages repeatedly.",
      "Rows that end up as their own best exemplar become cluster centers.",
    ],
    formulas: [
      {
        label: "Responsibility",
        expression: "r(i, k) ← s(i, k) − max_{k′≠k} [ a(i, k′) + s(i, k′) ]",
      },
      {
        label: "Availability",
        expression: "a(i, k) ← min(0, r(k, k) + Σ_{i′∉{i,k}} max(0, r(i′, k)))",
      },
    ],
    strengths: [
      "Chooses the number of clusters itself.",
      "Exemplars are real rows.",
    ],
    limitations: [
      "Memory grows with rows squared (limited here).",
      "Can fail to converge on some data.",
    ],
  },
} satisfies Record<string, ModelGuide>;

type GuideKey = keyof typeof GUIDES;

const MODEL_GUIDE_KEYS: Record<string, GuideKey> = {
  linear_regression: "linear",
  ridge: "ridge",
  lasso: "lasso",
  elasticnet: "elasticnet",
  bayesian_ridge: "bayesianRidge",
  huber: "huber",
  sgd_regressor: "sgdRegressor",
  theil_sen: "theilSen",
  ransac: "ransac",
  decision_tree_reg: "decisionTree",
  extra_tree_reg: "extraTree",
  random_forest_reg: "randomForest",
  extra_trees_reg: "extraTrees",
  bagging_reg: "bagging",
  gradient_boosting_reg: "gradientBoosting",
  hist_gradient_boosting_reg: "histGradientBoosting",
  adaboost_reg: "adaboost",
  xgboost_reg: "xgboost",
  lgbm_reg: "lightgbm",
  catboost_reg: "catboost",
  stacking_reg: "stackingReg",
  voting_reg: "votingReg",
  svr: "svr",
  linear_svr: "linearSvr",
  nu_svr: "nuSvr",
  knn_reg: "knnReg",
  mlp_reg: "mlpReg",
  gaussian_process_reg: "gpReg",
  logistic_regression: "logistic",
  sgd_classifier: "sgdClassifier",
  ridge_classifier: "ridgeClassifier",
  perceptron: "perceptron",
  passive_aggressive: "passiveAggressive",
  decision_tree_clf: "decisionTree",
  extra_tree_clf: "extraTree",
  random_forest_clf: "randomForest",
  extra_trees_clf: "extraTrees",
  bagging_clf: "bagging",
  gradient_boosting_clf: "gradientBoosting",
  hist_gradient_boosting_clf: "histGradientBoosting",
  adaboost_clf: "adaboost",
  xgboost_clf: "xgboost",
  lgbm_clf: "lightgbm",
  catboost_clf: "catboost",
  stacking_clf: "stackingClf",
  voting_clf_hard: "votingHard",
  voting_clf_soft: "votingSoft",
  svc: "svc",
  linear_svc: "linearSvc",
  nu_svc: "nuSvc",
  knn_clf: "knnClf",
  gaussian_nb: "gaussianNb",
  bernoulli_nb: "bernoulliNb",
  complement_nb: "complementNb",
  lda: "lda",
  qda: "qda",
  mlp_clf: "mlpClf",
  gaussian_process_clf: "gpClf",
  kmeans: "kmeans",
  minibatch_kmeans: "miniBatchKmeans",
  dbscan: "dbscan",
  mean_shift: "meanShift",
  gaussian_mixture: "gaussianMixture",
  agglomerative: "agglomerative",
  birch: "birch",
  spectral: "spectral",
  optics: "optics",
  affinity_propagation: "affinityPropagation",
};

export function getModelGuide(modelKey: string): ModelGuide | null {
  const key = MODEL_GUIDE_KEYS[modelKey];
  return key ? GUIDES[key] : null;
}
