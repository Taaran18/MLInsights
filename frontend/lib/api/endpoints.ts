import {
  request,
  requestBlob,
  uploadFile,
  type UploadOptions,
} from "@/lib/api/client";
import type {
  CleanImpact,
  CleanOptions,
  CompareResponse,
  CorrelationResponse,
  DescribeResponse,
  DtypesResponse,
  HealthResponse,
  MissingResponse,
  ModelCatalog,
  Overview,
  RecommendResponse,
  ResultsResponse,
  SessionSummary,
  TablePreview,
  TargetSuggestion,
  TaskType,
  TrainRequest,
  TrainResponse,
  UploadResponse,
  ValueCountsResponse,
} from "@/lib/api/types";

const sid = (sessionId: string) => encodeURIComponent(sessionId);

export const api = {
  health: (signal?: AbortSignal) =>
    request<HealthResponse>("/health", {
      signal,
      timeoutMs: 20_000,
      retries: 0,
      skipWake: true,
    }),

  upload: (file: File, options?: UploadOptions) =>
    uploadFile<UploadResponse>("/api/upload", file, options),

  session: (sessionId: string, signal?: AbortSignal) =>
    request<SessionSummary>(`/api/sessions/${sid(sessionId)}`, { signal }),

  sessionsStatus: (ids: string[], signal?: AbortSignal) =>
    request<{ sessions: Record<string, SessionSummary | null> }>(
      "/api/sessions/status",
      {
        method: "POST",
        json: { ids },
        signal,
        retries: 2,
      },
    ),

  deleteSession: (sessionId: string) =>
    request<void>(`/api/sessions/${sid(sessionId)}`, {
      method: "DELETE",
      retries: 1,
    }),

  deleteSessions: (ids: string[]) =>
    request<{ deleted: number }>("/api/sessions/delete", {
      method: "POST",
      json: { ids },
      retries: 1,
    }),

  overview: (sessionId: string, signal?: AbortSignal) =>
    request<Overview>(`/api/insights/${sid(sessionId)}/overview`, { signal }),

  head: (sessionId: string, n: number, signal?: AbortSignal) =>
    request<TablePreview>(`/api/insights/${sid(sessionId)}/head?n=${n}`, {
      signal,
    }),

  tail: (sessionId: string, n: number, signal?: AbortSignal) =>
    request<TablePreview>(`/api/insights/${sid(sessionId)}/tail?n=${n}`, {
      signal,
    }),

  dtypes: (sessionId: string, signal?: AbortSignal) =>
    request<DtypesResponse>(`/api/insights/${sid(sessionId)}/dtypes`, {
      signal,
    }),

  describe: (sessionId: string, signal?: AbortSignal) =>
    request<DescribeResponse>(`/api/insights/${sid(sessionId)}/describe`, {
      signal,
    }),

  missing: (sessionId: string, signal?: AbortSignal) =>
    request<MissingResponse>(`/api/insights/${sid(sessionId)}/missing`, {
      signal,
    }),

  correlation: (sessionId: string, signal?: AbortSignal) =>
    request<CorrelationResponse>(
      `/api/insights/${sid(sessionId)}/correlation`,
      { signal },
    ),

  valueCounts: (sessionId: string, column: string, signal?: AbortSignal) =>
    request<ValueCountsResponse>(
      `/api/insights/${sid(sessionId)}/value_counts?column=${encodeURIComponent(column)}&top_n=20`,
      { signal },
    ),

  previewClean: (
    sessionId: string,
    options: CleanOptions,
    signal?: AbortSignal,
  ) =>
    request<CleanImpact>(`/api/cleaning/${sid(sessionId)}/preview`, {
      method: "POST",
      json: options,
      signal,
      timeoutMs: 120_000,
      retries: 1,
    }),

  clean: (sessionId: string, options: CleanOptions) =>
    request<CleanImpact & { message: string }>(
      `/api/cleaning/${sid(sessionId)}/clean`,
      {
        method: "POST",
        json: options,
        timeoutMs: 120_000,
      },
    ),

  resetCleaning: (sessionId: string) =>
    request<{ message: string }>(`/api/cleaning/${sid(sessionId)}/reset`, {
      method: "POST",
      retries: 1,
    }),

  catalog: (signal?: AbortSignal) =>
    request<ModelCatalog>("/api/models/catalog", { signal }),

  suggestTarget: (sessionId: string, task: TaskType, signal?: AbortSignal) =>
    request<{ suggestions: TargetSuggestion[] }>(
      `/api/models/${sid(sessionId)}/suggest_target?task=${task}`,
      { signal },
    ),

  recommend: (
    sessionId: string,
    task: TaskType,
    targetCol: string | null,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({ task });
    if (targetCol) params.set("target_col", targetCol);
    return request<RecommendResponse>(
      `/api/models/${sid(sessionId)}/recommend?${params}`,
      {
        signal,
      },
    );
  },

  train: (sessionId: string, body: TrainRequest, signal?: AbortSignal) =>
    request<TrainResponse>(`/api/training/${sid(sessionId)}/train`, {
      method: "POST",
      json: body,
      signal,
      timeoutMs: 15 * 60_000,
    }),

  results: (sessionId: string, signal?: AbortSignal) =>
    request<ResultsResponse>(`/api/training/${sid(sessionId)}/results`, {
      signal,
    }),

  compare: (sessionId: string, signal?: AbortSignal) =>
    request<CompareResponse>(`/api/training/${sid(sessionId)}/compare`, {
      signal,
    }),

  deleteResult: (sessionId: string, modelKey: string) =>
    request<{ removed: boolean }>(
      `/api/training/${sid(sessionId)}/results/${encodeURIComponent(modelKey)}`,
      { method: "DELETE", retries: 1 },
    ),

  download: (path: string) => requestBlob(path, { retries: 1 }),
};

export const reportPaths = {
  pdf: (sessionId: string) => `/api/report/${sid(sessionId)}/pdf`,
  dataset: (sessionId: string, format: "csv" | "xlsx") =>
    `/api/report/${sid(sessionId)}/dataset?fmt=${format}`,
  meta: (sessionId: string) => `/api/report/${sid(sessionId)}/meta`,
  models: (sessionId: string) => `/api/report/${sid(sessionId)}/models_zip`,
};
