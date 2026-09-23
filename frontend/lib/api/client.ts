import { API_URL } from "@/lib/site";
import { sleep } from "@/lib/utils";

export type ApiErrorKind = "network" | "timeout" | "http" | "aborted";

const NETWORK_MESSAGE =
  "We couldn't reach the analysis server. Check your connection and try again. If the server has been idle, it can take up to a minute to wake up.";
const TIMEOUT_MESSAGE =
  "The server took too long to respond. Try again, or use a smaller dataset or a lighter model.";

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request couldn't be processed. Check your input and try again.",
  404: "We couldn't find what you were looking for.",
  413: "This file is too large to upload.",
  422: "Some of the information provided isn't valid.",
  429: "Too many requests at once. Wait a moment and try again.",
  500: "Something went wrong on our side. Please try again in a moment.",
  502: "The analysis server is starting up or temporarily unavailable. Try again in a moment.",
  503: "The analysis server is starting up or temporarily unavailable. Try again in a moment.",
  504: "The analysis server took too long to respond. Try again in a moment.",
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string | null;
  readonly requestId: string | null;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number;
      code?: string | null;
      requestId?: string | null;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status ?? 0;
    this.code = options.code ?? null;
    this.requestId = options.requestId ?? null;
  }

  get isSessionExpired(): boolean {
    return this.code === "session_not_found";
  }

  get isRetryable(): boolean {
    return (
      this.kind === "network" ||
      this.kind === "timeout" ||
      [429, 502, 503, 504].includes(this.status)
    );
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(
  error: unknown,
  fallback = STATUS_MESSAGES[500],
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function messageFromDetail(detail: unknown, status: number): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    const field = Array.isArray(first.loc)
      ? first.loc[first.loc.length - 1]
      : null;
    if (first.msg) {
      return field && typeof field === "string"
        ? `Check “${field}”: ${first.msg.replace(/^Value error, /, "")}.`
        : `${first.msg}.`;
    }
  }
  return STATUS_MESSAGES[status] ?? STATUS_MESSAGES[500];
}

export function errorFromResponse(
  status: number,
  body: unknown,
  headers: { get(name: string): string | null },
): ApiError {
  const detail =
    body && typeof body === "object" && "detail" in body
      ? (body as { detail: unknown }).detail
      : null;
  return new ApiError("http", messageFromDetail(detail, status), {
    status,
    code: headers.get("X-Error-Code"),
    requestId: headers.get("X-Request-ID"),
  });
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  json?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  skipWake?: boolean;
}

export type WakeState = "waking" | "awake" | "failed";

const AWAKE_WINDOW_MS = 4 * 60_000;
const WAKE_TIMEOUT_MS = 90_000;
const WAKE_NOTICE_DELAY_MS = 2_500;
let lastResponseAt = 0;
let waking: Promise<void> | null = null;
const wakeListeners = new Set<(state: WakeState) => void>();

export function onWakeState(listener: (state: WakeState) => void) {
  wakeListeners.add(listener);
  return () => {
    wakeListeners.delete(listener);
  };
}

function emitWake(state: WakeState) {
  wakeListeners.forEach((listener) => listener(state));
}

function markServerResponded(status: number) {
  if (![502, 503, 504].includes(status)) lastResponseAt = Date.now();
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", json, signal, timeoutMs = 30_000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers:
        json === undefined ? undefined : { "Content-Type": "application/json" },
      body: json === undefined ? undefined : JSON.stringify(json),
      signal: controller.signal,
      cache: "no-store",
    });
    markServerResponded(response.status);
    if (!response.ok) {
      throw errorFromResponse(
        response.status,
        await parseBody(response),
        response.headers,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted)
      throw new ApiError("aborted", "The request was cancelled.");
    if (controller.signal.aborted)
      throw new ApiError("timeout", TIMEOUT_MESSAGE);
    throw new ApiError("network", NETWORK_MESSAGE);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

export function ensureAwake(): Promise<void> {
  if (Date.now() - lastResponseAt < AWAKE_WINDOW_MS) return Promise.resolve();
  if (waking) return waking;
  waking = (async () => {
    const started = Date.now();
    let announced = false;
    const notice = setTimeout(() => {
      announced = true;
      emitWake("waking");
    }, WAKE_NOTICE_DELAY_MS);
    let delay = 1_000;
    try {
      for (;;) {
        try {
          await send("/health", { timeoutMs: 20_000 });
          if (announced) emitWake("awake");
          return;
        } catch (error) {
          const retryable = error instanceof ApiError && error.isRetryable;
          if (!retryable || Date.now() - started > WAKE_TIMEOUT_MS) {
            if (announced) emitWake("failed");
            throw error instanceof ApiError && retryable
              ? new ApiError(
                  "network",
                  "The analysis server didn't wake up in time. Please try again in a minute.",
                )
              : error;
          }
          if (!announced) {
            announced = true;
            emitWake("waking");
          }
          await sleep(delay);
          delay = Math.min(delay * 1.6, 5_000);
        }
      }
    } finally {
      clearTimeout(notice);
    }
  })().finally(() => {
    waking = null;
  });
  return waking;
}

async function withRetries<T>(
  options: RequestOptions,
  run: () => Promise<T>,
): Promise<T> {
  if (!options.skipWake) await ensureAwake();
  const retries =
    options.retries ?? ((options.method ?? "GET") === "GET" ? 2 : 0);
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const retryable = error instanceof ApiError && error.isRetryable;
      if (!retryable || attempt >= retries || options.signal?.aborted)
        throw error;
      await sleep(500 * 2 ** attempt + Math.random() * 250, options.signal);
    }
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return withRetries(options, async () => {
    const response = await send(path, options);
    if (response.status === 204) return undefined as T;
    return (await parseBody(response)) as T;
  });
}

export async function requestBlob(
  path: string,
  options: RequestOptions = {},
): Promise<{ blob: Blob; filename: string | null }> {
  return withRetries(options, async () => {
    const response = await send(path, { timeoutMs: 120_000, ...options });
    return {
      blob: await response.blob(),
      filename: filenameFromDisposition(
        response.headers.get("Content-Disposition"),
      ),
    };
  });
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      return null;
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : null;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface UploadOptions {
  onProgress?: (fraction: number) => void;
  onUploaded?: () => void;
  signal?: AbortSignal;
}

export async function uploadFile<T>(
  path: string,
  file: File,
  options: UploadOptions = {},
): Promise<T> {
  await ensureAwake();
  if (options.signal?.aborted)
    throw new ApiError("aborted", "The upload was cancelled.");
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl(path));
    xhr.timeout = 5 * 60_000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        options.onProgress?.(event.loaded / event.total);
    };
    xhr.upload.onload = () => {
      options.onProgress?.(1);
      options.onUploaded?.();
    };
    xhr.onload = () => {
      markServerResponded(xhr.status);
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
        return;
      }
      reject(
        errorFromResponse(xhr.status, body, {
          get: (name: string) => xhr.getResponseHeader(name),
        }),
      );
    };
    xhr.onerror = () => reject(new ApiError("network", NETWORK_MESSAGE));
    xhr.ontimeout = () => reject(new ApiError("timeout", TIMEOUT_MESSAGE));
    xhr.onabort = () =>
      reject(new ApiError("aborted", "The upload was cancelled."));
    options.signal?.addEventListener("abort", () => xhr.abort(), {
      once: true,
    });

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}
