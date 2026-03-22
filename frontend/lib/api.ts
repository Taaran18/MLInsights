import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE });

// ── Upload ────────────────────────────────────────────────────────────────
export async function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/upload", form);
  return data;
}

// ── Insights ─────────────────────────────────────────────────────────────
export async function getOverview(sessionId: string) {
  const { data } = await api.get(`/api/insights/${sessionId}/overview`);
  return data;
}
export async function getHead(sessionId: string, n = 10) {
  const { data } = await api.get(`/api/insights/${sessionId}/head?n=${n}`);
  return data;
}
export async function getTail(sessionId: string, n = 10) {
  const { data } = await api.get(`/api/insights/${sessionId}/tail?n=${n}`);
  return data;
}
export async function getDtypes(sessionId: string) {
  const { data } = await api.get(`/api/insights/${sessionId}/dtypes`);
  return data;
}
export async function getDescribe(sessionId: string) {
  const { data } = await api.get(`/api/insights/${sessionId}/describe`);
  return data;
}
export async function getMissing(sessionId: string) {
  const { data } = await api.get(`/api/insights/${sessionId}/missing`);
  return data;
}
export async function getCorrelation(sessionId: string) {
  const { data } = await api.get(`/api/insights/${sessionId}/correlation`);
  return data;
}
export async function getValueCounts(sessionId: string, column: string) {
  const { data } = await api.get(`/api/insights/${sessionId}/value_counts/${column}`);
  return data;
}

// ── Cleaning ──────────────────────────────────────────────────────────────
export interface CleanOptions {
  drop_duplicates?: boolean;
  fill_numeric?: string | null;
  fill_categorical?: string | null;
  drop_high_missing_cols?: number | null;
  drop_high_missing_rows?: number | null;
  normalize_empty_strings?: boolean;
}
export async function cleanDataset(sessionId: string, options: CleanOptions) {
  const { data } = await api.post(`/api/cleaning/${sessionId}/clean`, options);
  return data;
}
export async function resetCleaning(sessionId: string) {
  const { data } = await api.post(`/api/cleaning/${sessionId}/reset`);
  return data;
}

// ── Models ────────────────────────────────────────────────────────────────
export async function getModelCatalog() {
  const { data } = await api.get("/api/models/catalog");
  return data;
}
export async function getRecommendations(sessionId: string, targetCol?: string) {
  const params = targetCol ? `?target_col=${targetCol}` : "";
  const { data } = await api.get(`/api/models/${sessionId}/recommend${params}`);
  return data;
}
export async function getSuggestTarget(sessionId: string, task: string) {
  const { data } = await api.get(`/api/models/${sessionId}/suggest_target?task=${task}`);
  return data;
}

// ── Training ──────────────────────────────────────────────────────────────
export interface TrainRequest {
  model_key: string;
  task: string;
  target_col?: string;
  feature_cols?: string[];
  test_size?: number;
  scaler_type?: "none" | "standard" | "minmax" | "robust";
}
export async function trainModel(sessionId: string, req: TrainRequest) {
  const { data } = await api.post(`/api/training/${sessionId}/train`, req);
  return data;
}
export async function getTrainingResults(sessionId: string) {
  const { data } = await api.get(`/api/training/${sessionId}/results`);
  return data;
}
export async function compareModels(sessionId: string) {
  const { data } = await api.get(`/api/training/${sessionId}/compare`);
  return data;
}
export async function deleteModelResult(sessionId: string, modelKey: string) {
  const { data } = await api.delete(`/api/training/${sessionId}/results/${modelKey}`);
  return data;
}

// ── Report / Downloads ────────────────────────────────────────────────────
export function getPdfUrl(sessionId: string) {
  return `${BASE}/api/report/${sessionId}/pdf`;
}
export function getDatasetUrl(sessionId: string, fmt: "csv" | "xlsx" = "csv") {
  return `${BASE}/api/report/${sessionId}/dataset?fmt=${fmt}`;
}
export function getMetaUrl(sessionId: string) {
  return `${BASE}/api/report/${sessionId}/meta`;
}
export function getModelsZipUrl(sessionId: string) {
  return `${BASE}/api/report/${sessionId}/models_zip`;
}
