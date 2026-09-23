import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { markSessionExpired } from "@/lib/session-store";

export type ResourceStatus = "idle" | "loading" | "success" | "error";

export interface Resource<T> {
  status: ResourceStatus;
  data: T | undefined;
  error: ApiError | null;
  isRefreshing: boolean;
  reload: () => void;
}

interface Entry<T> {
  key: string | null;
  scope: string | null;
  data?: T;
  error?: ApiError;
  previous?: T;
}

const MAX_ENTRIES = 60;
const cache = new Map<string, unknown>();

function remember(key: string, value: unknown) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function invalidateResources(prefix: string) {
  for (const key of [...cache.keys()])
    if (key.startsWith(prefix)) cache.delete(key);
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(
    "network",
    error instanceof Error ? error.message : "Something went wrong.",
  );
}

export function useResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: { sessionId?: string | null; keepPrevious?: boolean } = {},
): Resource<T> {
  const { sessionId = null, keepPrevious = false } = options;
  const scope = sessionId;
  const [entry, setEntry] = useState<Entry<T>>(() => ({
    key,
    scope,
    data: key ? (cache.get(key) as T | undefined) : undefined,
  }));
  const [attempt, setAttempt] = useState(0);

  const current: Entry<T> =
    entry.key === key
      ? entry
      : {
          key,
          scope,
          data: key ? (cache.get(key) as T | undefined) : undefined,
          previous:
            keepPrevious && entry.scope === scope
              ? (entry.data ?? entry.previous)
              : undefined,
        };

  const needsFetch =
    key !== null && current.data === undefined && current.error === undefined;

  const runFetch = useEffectEvent((signal: AbortSignal) => fetcher(signal));
  const onExpired = useEffectEvent(() => {
    if (sessionId) markSessionExpired(sessionId);
  });

  useEffect(() => {
    if (!key || !needsFetch) return;
    const controller = new AbortController();
    runFetch(controller.signal).then(
      (data) => {
        remember(key, data);
        if (!controller.signal.aborted) setEntry({ key, scope, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = toApiError(error);
        if (apiError.kind === "aborted") return;
        if (apiError.isSessionExpired) onExpired();
        setEntry((prev) => ({
          key,
          scope,
          error: apiError,
          previous:
            prev.scope === scope ? (prev.data ?? prev.previous) : undefined,
        }));
      },
    );
    return () => controller.abort();
  }, [key, scope, needsFetch, attempt]);

  const reload = useCallback(() => {
    if (key) cache.delete(key);
    setEntry((prev) => ({
      key,
      scope,
      previous: prev.scope === scope ? (prev.data ?? prev.previous) : undefined,
    }));
    setAttempt((value) => value + 1);
  }, [key, scope]);

  const status: ResourceStatus =
    key === null
      ? "idle"
      : current.error
        ? "error"
        : current.data !== undefined
          ? "success"
          : "loading";

  const shownData =
    current.data ?? (keepPrevious ? current.previous : undefined);

  return {
    status,
    data: shownData,
    error: current.error ?? null,
    isRefreshing: status === "loading" && shownData !== undefined,
    reload,
  };
}
