export interface MetricGuide {
  title: string;
  meaning: string;
  formula: string;
  legend: string;
  reading: string;
  range: string;
}

const CONFUSION_LEGEND =
  "TP = true positives, TN = true negatives, FP = false positives, FN = false negatives.";

export const METRIC_GUIDES: Record<string, MetricGuide> = {
  Accuracy: {
    title: "Accuracy",
    meaning:
      "The share of test rows the model classified correctly. It's the most intuitive score, but it can flatter a model when one class dominates.",
    formula: "Accuracy = (TP + TN) ÷ (TP + TN + FP + FN)",
    legend: `${CONFUSION_LEGEND} With several classes: correct predictions ÷ all predictions.`,
    reading:
      "90% means 9 out of 10 test rows got the right class. Compare it with the share of the most common class: a model must beat that to be useful.",
    range: "0% to 100%, higher is better.",
  },
  Precision: {
    title: "Precision",
    meaning:
      "Of all the rows the model labeled as a class, how many truly belonged to it. High precision means few false alarms.",
    formula: "Precision = TP ÷ (TP + FP)",
    legend: `${CONFUSION_LEGEND} With several classes, each class's precision is averaged, weighted by how many rows it has.`,
    reading:
      "Matters most when a false positive is costly, such as flagging a legitimate payment as fraud.",
    range: "0% to 100%, higher is better.",
  },
  Recall: {
    title: "Recall",
    meaning:
      "Of all the rows that truly belong to a class, how many the model found. High recall means few misses.",
    formula: "Recall = TP ÷ (TP + FN)",
    legend: `${CONFUSION_LEGEND} With several classes, each class's recall is averaged, weighted by how many rows it has.`,
    reading:
      "Matters most when a miss is costly, such as failing to detect a disease.",
    range: "0% to 100%, higher is better.",
  },
  "F1 Score": {
    title: "F1 Score",
    meaning:
      "The harmonic mean of precision and recall. It's only high when both are high, so it's a fair single score for imbalanced classes.",
    formula: "F1 = 2 · (Precision · Recall) ÷ (Precision + Recall)",
    legend:
      "A harmonic mean punishes imbalance: 100% precision with 10% recall gives an F1 of only 18%.",
    reading:
      "Use it instead of accuracy when classes are uneven or when both false alarms and misses matter.",
    range: "0% to 100%, higher is better.",
  },
  "ROC AUC": {
    title: "ROC AUC",
    meaning:
      "The Area Under the ROC Curve: the probability that the model scores a random positive row higher than a random negative one. It measures ranking quality across every possible threshold.",
    formula:
      "AUC = ∫ TPR d(FPR),   TPR = TP ÷ (TP + FN),   FPR = FP ÷ (FP + TN)",
    legend:
      "With several classes, each class is scored one-versus-rest and the results are averaged, weighted by class size.",
    reading:
      "50% is random guessing and 100% is perfect separation. Above 80% is usually good.",
    range: "0% to 100%, higher is better.",
  },
  "CV Mean": {
    title: "Cross-Validation Mean",
    meaning:
      "The average score over 5-fold cross-validation: the data is split into 5 parts, and each part takes a turn as the test set. It guards against a single lucky or unlucky split.",
    formula: "CV Mean = (1 ÷ 5) · Σₖ scoreₖ",
    legend:
      "scoreₖ is accuracy for classification and R² for regression on fold k.",
    reading:
      "If the CV Mean is far below the test-split score, the test split was probably easier than average.",
    range: "Same range as the underlying score, higher is better.",
  },
  "CV Std": {
    title: "Cross-Validation Spread",
    meaning:
      "The standard deviation of the 5 cross-validation scores. It shows how stable the model is from one slice of data to another.",
    formula: "CV Std = √( (1 ÷ 5) · Σₖ (scoreₖ − mean)² )",
    legend: "mean is the CV Mean.",
    reading:
      "Small values mean dependable performance. A large spread means results depend heavily on which rows the model sees.",
    range: "0 and up, lower is better.",
  },
  "R2 Score": {
    title: "R² (Coefficient of Determination)",
    meaning:
      "The share of the target's variation that the model explains, compared with always predicting the average.",
    formula: "R² = 1 − Σᵢ (yᵢ − ŷᵢ)² ÷ Σᵢ (yᵢ − ȳ)²",
    legend:
      "yᵢ is the actual value, ŷᵢ the prediction, and ȳ the average actual value.",
    reading:
      "100% is a perfect fit, 0% is no better than the average, and negative values are worse than the average.",
    range: "Up to 100%, higher is better.",
  },
  MAE: {
    title: "Mean Absolute Error",
    meaning:
      "The average size of the errors, in the same units as the target. Every error counts in proportion to its size.",
    formula: "MAE = (1 ÷ n) · Σᵢ |yᵢ − ŷᵢ|",
    legend: "yᵢ is the actual value and ŷᵢ the prediction.",
    reading:
      "An MAE of 12 when predicting prices in dollars means predictions are off by about $12 on average.",
    range: "0 and up, lower is better.",
  },
  MSE: {
    title: "Mean Squared Error",
    meaning:
      "The average of the squared errors. Squaring makes large mistakes count much more than small ones.",
    formula: "MSE = (1 ÷ n) · Σᵢ (yᵢ − ŷᵢ)²",
    legend:
      "Measured in squared units of the target, so compare it between models rather than reading it directly.",
    reading:
      "Prefer models with lower MSE when big errors are especially harmful.",
    range: "0 and up, lower is better.",
  },
  RMSE: {
    title: "Root Mean Squared Error",
    meaning:
      "The square root of MSE, which brings the error back to the target's own units while still penalizing large mistakes.",
    formula: "RMSE = √( (1 ÷ n) · Σᵢ (yᵢ − ŷᵢ)² )",
    legend:
      "Always at least as large as MAE; a big gap between them signals a few large errors.",
    reading:
      "Think of it as the typical error size, with extra weight on the worst misses.",
    range: "0 and up, lower is better.",
  },
  "MAPE (%)": {
    title: "Mean Absolute Percentage Error",
    meaning:
      "The average error as a percentage of the actual value, which makes it easy to compare across targets of different scales.",
    formula: "MAPE = (100 ÷ n) · Σᵢ |(yᵢ − ŷᵢ) ÷ yᵢ|",
    legend: "Computed only over rows where the actual value isn't zero.",
    reading:
      "A MAPE of 8% means predictions are typically within 8% of the true value.",
    range: "0% and up, lower is better.",
  },
  "Silhouette Score": {
    title: "Silhouette Score",
    meaning:
      "How much closer each row is to its own cluster than to the nearest other cluster, averaged over all rows.",
    formula: "s = (b − a) ÷ max(a, b)",
    legend:
      "a is the average distance to rows in the same cluster, and b the average distance to rows in the nearest other cluster.",
    reading:
      "Near 1 means tight, well-separated clusters; near 0 means overlapping clusters; negative means rows may be in the wrong cluster.",
    range: "−1 to 1, higher is better.",
  },
  "Davies-Bouldin Score": {
    title: "Davies–Bouldin Index",
    meaning:
      "The average similarity between each cluster and the cluster most like it, comparing their spread with the distance between them.",
    formula: "DB = (1 ÷ k) · Σᵢ maxⱼ≠ᵢ (σᵢ + σⱼ) ÷ d(cᵢ, cⱼ)",
    legend:
      "σᵢ is the average distance of cluster i's rows to its center cᵢ, and d(cᵢ, cⱼ) the distance between centers.",
    reading:
      "0 is ideal. Lower values mean compact clusters that are far apart.",
    range: "0 and up, lower is better.",
  },
  "Calinski-Harabasz Score": {
    title: "Calinski–Harabasz Index",
    meaning:
      "The ratio of spread between clusters to spread within clusters, also called the variance ratio criterion.",
    formula: "CH = [ tr(B) ÷ (k − 1) ] ÷ [ tr(W) ÷ (n − k) ]",
    legend:
      "B is the between-cluster scatter, W the within-cluster scatter, k the number of clusters, and n the number of rows.",
    reading:
      "Higher means denser, better-separated clusters. Compare it across models on the same data.",
    range: "0 and up, higher is better.",
  },
};

export function getMetricGuide(name: string): MetricGuide | null {
  return METRIC_GUIDES[name] ?? null;
}
