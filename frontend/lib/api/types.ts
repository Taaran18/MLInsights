export type TaskType = "classification" | "regression" | "clustering";
export type ScalerType = "none" | "standard" | "minmax" | "robust";
export type Cell = string | number | boolean | null;

export interface UploadResponse {
  session_id: string;
  filename: string;
  rows: number;
  columns: number;
  has_missing: boolean;
  total_missing: number;
  created_at: string;
  expires_at: string;
}

export interface SessionSummary {
  session_id: string;
  filename: string;
  rows: number;
  columns: number;
  is_cleaned: boolean;
  trained_models: number;
  created_at: string;
  expires_at: string;
}

export interface Overview {
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  datetime_columns: string[];
  memory_usage_kb: number;
  duplicate_rows: number;
  is_cleaned: boolean;
  total_missing: number;
  total_missing_percentage: number;
  trained_models: number;
}

export interface TablePreview {
  data: Record<string, Cell>[];
  columns: string[];
}

export interface DtypesResponse {
  dtypes: Record<string, string>;
}

export interface DescribeResponse {
  describe: Record<string, Record<string, Cell>>;
}

export interface ColumnMissing {
  count: number;
  percentage: number;
  dtype: string;
}

export interface MissingResponse {
  total_cells: number;
  total_missing: number;
  total_missing_percentage: number;
  per_column: Record<string, ColumnMissing>;
}

export interface CorrelationResponse {
  correlation: Record<string, Record<string, number | null>>;
}

export interface ValueCountsResponse {
  column: string;
  unique: number;
  missing: number;
  counts: { value: Cell; count: number }[];
}

export type NumericFill = "mean" | "median" | "zero";
export type CategoricalFill = "mode" | "unknown";

export interface CleanOptions {
  drop_duplicates: boolean;
  fill_numeric: NumericFill | null;
  fill_categorical: CategoricalFill | null;
  drop_high_missing_cols: number | null;
  drop_high_missing_rows: number | null;
  normalize_empty_strings: boolean;
}

export interface CleanStats {
  rows: number;
  columns: number;
  missing: number;
}

export interface CleanImpact {
  before: CleanStats;
  after: CleanStats;
  dropped_rows: number;
  dropped_columns: string[];
}

export interface ModelInfo {
  key: string;
  name: string;
  category: string;
  description: string;
}

export type ModelCatalog = Record<TaskType, ModelInfo[]>;

export interface TargetSuggestion {
  column: string;
  score: number;
  reasons: string[];
  n_unique: number;
  dtype: string;
}

export interface RecommendResponse {
  task: TaskType;
  inferred_task: TaskType;
  n_rows: number;
  n_cols: number;
  target_col: string | null;
  id_like_columns: string[];
  recommendations: ModelInfo[];
}

export interface TrainRequest {
  model_key: string;
  task: TaskType;
  target_col?: string | null;
  feature_cols?: string[] | null;
  test_size?: number;
  scaler_type?: ScalerType;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ModelMetrics {
  [metric: string]:
    number | number[][] | Record<string, number> | string[] | undefined;
  confusion_matrix?: number[][];
  class_distribution?: Record<string, number>;
  class_labels?: string[];
}

export interface TrainedModel {
  name: string;
  category?: string | null;
  task: TaskType;
  metrics: ModelMetrics;
  feature_importances: FeatureImportance[] | null;
  feature_cols: string[];
  target_col: string | null;
  train_size?: number | null;
  test_size_n?: number | null;
  test_size?: number | null;
  scaler_type?: ScalerType;
  duration_ms?: number;
  trained_at?: string;
}

export interface TrainResponse extends TrainedModel {
  model_key: string;
  model_name: string;
  labels_sample?: number[] | null;
}

export interface ResultsResponse {
  trained_models: Record<string, TrainedModel>;
}

export interface ComparisonRow {
  model_key: string;
  model_name: string;
  task: TaskType;
  target_col: string | null;
  category: string | null;
  [metric: string]: string | number | null;
}

export interface CompareResponse {
  comparison: ComparisonRow[];
}

export interface HealthResponse {
  status: string;
  version: string;
  session_ttl_hours: number;
}
