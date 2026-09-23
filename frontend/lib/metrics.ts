import type { ModelMetrics, TaskType } from "@/lib/api/types";
import { formatDecimal, formatInteger } from "@/lib/utils";

export const HIGHER_IS_BETTER = new Set([
  "R2 Score",
  "Accuracy",
  "Precision",
  "Recall",
  "F1 Score",
  "ROC AUC",
  "Silhouette Score",
  "CV Mean",
  "Calinski-Harabasz Score",
]);

export const LOWER_IS_BETTER = new Set([
  "MAE",
  "MSE",
  "RMSE",
  "MAPE (%)",
  "Davies-Bouldin Score",
  "CV Std",
]);

const PERCENT_METRICS = new Set([
  "Accuracy",
  "Precision",
  "Recall",
  "F1 Score",
  "ROC AUC",
  "CV Mean",
  "R2 Score",
]);

const HIDDEN_METRICS = new Set([
  "confusion_matrix",
  "class_distribution",
  "class_labels",
  "n_clusters",
  "n_noise_points",
]);

const PRIMARY_METRICS: Record<TaskType, string[]> = {
  classification: ["Accuracy", "F1 Score", "ROC AUC"],
  regression: ["R2 Score", "RMSE", "MAE"],
  clustering: [
    "Silhouette Score",
    "Calinski-Harabasz Score",
    "Davies-Bouldin Score",
  ],
};

export const METRIC_DESCRIPTIONS: Record<string, string> = {
  Accuracy: "Share of test rows the model predicted correctly.",
  Precision:
    "Of the rows predicted as a class, how many actually belonged to it.",
  Recall: "Of the rows that belong to a class, how many the model found.",
  "F1 Score": "A balance of precision and recall in a single number.",
  "ROC AUC":
    "How well the model ranks positives above negatives. 50% is random guessing.",
  "CV Mean":
    "Average score across 5-fold cross-validation, a check against lucky splits.",
  "CV Std": "Spread of the cross-validation scores. Lower means more stable.",
  "R2 Score":
    "Share of the target's variation the model explains. 100% is perfect.",
  MAE: "Average absolute error, in the same units as the target.",
  MSE: "Average squared error. Punishes large mistakes heavily.",
  RMSE: "Typical error size, in the same units as the target.",
  "MAPE (%)": "Average error as a percentage of the actual value.",
  "Silhouette Score": "How clearly separated the clusters are, from −1 to 1.",
  "Davies-Bouldin Score":
    "How similar clusters are to each other. Lower is better.",
  "Calinski-Harabasz Score":
    "Ratio of between-cluster to within-cluster spread.",
};

export type MetricDirection = "higher" | "lower" | null;

export function metricDirection(name: string): MetricDirection {
  if (HIGHER_IS_BETTER.has(name)) return "higher";
  if (LOWER_IS_BETTER.has(name)) return "lower";
  return null;
}

export function isPercentMetric(name: string): boolean {
  return PERCENT_METRICS.has(name);
}

export function formatMetric(
  name: string,
  value: number | null | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (PERCENT_METRICS.has(name)) return `${(value * 100).toFixed(2)}%`;
  if (name === "MAPE (%)") return `${formatDecimal(value, 2)}%`;
  if (Number.isInteger(value) && Math.abs(value) < 1e9)
    return formatInteger(value);
  return formatDecimal(value, 4);
}

export function metricBar(name: string, value: number): number | null {
  if (PERCENT_METRICS.has(name)) return Math.min(Math.max(value, 0), 1);
  if (name === "Silhouette Score")
    return Math.min(Math.max((value + 1) / 2, 0), 1);
  return null;
}

export function numericMetrics(
  metrics: ModelMetrics | undefined,
): [string, number][] {
  if (!metrics) return [];
  return Object.entries(metrics).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === "number" &&
      Number.isFinite(entry[1]) &&
      !HIDDEN_METRICS.has(entry[0]),
  );
}

export function primaryMetricFor(
  task: TaskType,
  available: Iterable<string>,
): string | null {
  const keys = new Set(available);
  return (
    PRIMARY_METRICS[task].find((metric) => keys.has(metric)) ??
    [...keys][0] ??
    null
  );
}

export function isBetter(
  name: string,
  candidate: number,
  best: number,
): boolean {
  return metricDirection(name) === "lower"
    ? candidate < best
    : candidate > best;
}

export function bestValue(name: string, values: number[]): number | null {
  if (values.length === 0) return null;
  return metricDirection(name) === "lower"
    ? Math.min(...values)
    : Math.max(...values);
}

export const TASK_LABELS: Record<TaskType, string> = {
  classification: "Classification",
  regression: "Regression",
  clustering: "Clustering",
};

export const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];
