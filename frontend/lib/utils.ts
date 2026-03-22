import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined, decimals = 4): string {
  if (n == null) return "—";
  return typeof n === "number" ? n.toFixed(decimals) : String(n);
}

// Metrics stored as 0–1 ratios that are more readable as percentages
const PCT_METRICS = new Set([
  "Accuracy", "Precision", "Recall", "F1 Score", "ROC AUC", "CV Mean", "R2 Score",
]);

export function formatMetric(key: string, value: number | null | undefined): string {
  if (value == null) return "—";
  if (PCT_METRICS.has(key)) {
    return `${(value * 100).toFixed(2)}%`;
  }
  return formatNumber(value);
}

export function isPercentMetric(key: string): boolean {
  return PCT_METRICS.has(key);
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export const TASK_COLORS: Record<string, string> = {
  regression: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  classification: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  clustering: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Linear": "bg-sky-500/10 text-sky-300",
  "Linear / Regularized": "bg-sky-500/10 text-sky-300",
  "Boosting": "bg-orange-500/10 text-orange-300",
  "Ensemble / Bagging": "bg-emerald-500/10 text-emerald-300",
  "Tree-based": "bg-green-500/10 text-green-300",
  "Stacking": "bg-violet-500/10 text-violet-300",
  "SVM": "bg-red-500/10 text-red-300",
  "Instance-based": "bg-yellow-500/10 text-yellow-300",
  "Naive Bayes": "bg-pink-500/10 text-pink-300",
  "Bayesian": "bg-pink-500/10 text-pink-300",
  "Probabilistic": "bg-fuchsia-500/10 text-fuchsia-300",
  "Robust Linear": "bg-teal-500/10 text-teal-300",
  "Neural Network (Shallow)": "bg-cyan-500/10 text-cyan-300",
  "Discriminant Analysis": "bg-amber-500/10 text-amber-300",
  "Centroid-based": "bg-indigo-500/10 text-indigo-300",
  "Density-based": "bg-rose-500/10 text-rose-300",
  "Hierarchical": "bg-lime-500/10 text-lime-300",
  "Graph-based": "bg-purple-500/10 text-purple-300",
  "Message Passing": "bg-orange-500/10 text-orange-300",
};
