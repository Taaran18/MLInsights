import { useSyncExternalStore } from "react";
import type { UploadResponse } from "@/lib/api/types";

export interface SessionRecord {
  id: string;
  filename: string;
  rows: number;
  columns: number;
  createdAt: string;
  expiresAt: string;
}

export interface CurrentSession {
  id: string;
  filename: string;
}

export interface SessionVersions {
  data: number;
  models: number;
}

const CURRENT_KEY = "mli:current";
const LAST_KEY = "mli:last";
const HISTORY_KEY = "mli:sessions";
const MAX_HISTORY = 20;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const EMPTY_HISTORY: SessionRecord[] = [];
const EMPTY_EXPIRED: ReadonlySet<string> = new Set();
const INITIAL_VERSIONS: SessionVersions = { data: 0, models: 0 };

let currentCache: CurrentSession | null | undefined;
let historyCache: SessionRecord[] | undefined;
let expiredCache: ReadonlySet<string> = EMPTY_EXPIRED;
let versionsCache: SessionVersions = INITIAL_VERSIONS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readJson(
  key: string,
  storage: "local" | "session" = "local",
): unknown {
  try {
    const raw = (
      storage === "local" ? window.localStorage : window.sessionStorage
    ).getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(
  key: string,
  value: unknown,
  storage: "local" | "session" = "local",
) {
  try {
    const target =
      storage === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) target.removeItem(key);
    else target.setItem(key, JSON.stringify(value));
  } catch {}
}

function toCurrent(value: unknown): CurrentSession | null {
  const candidate = value as CurrentSession | null;
  return candidate &&
    typeof candidate.id === "string" &&
    UUID_RE.test(candidate.id)
    ? { id: candidate.id, filename: String(candidate.filename ?? "") }
    : null;
}

function isRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as SessionRecord;
  return (
    typeof record.id === "string" &&
    UUID_RE.test(record.id) &&
    typeof record.filename === "string"
  );
}

export function getCurrentSession(): CurrentSession | null {
  if (currentCache !== undefined) return currentCache;
  const perTab = readJson(CURRENT_KEY, "session");
  currentCache =
    perTab === null ? toCurrent(readJson(LAST_KEY)) : toCurrent(perTab);
  return currentCache;
}

export function getSessionHistory(): SessionRecord[] {
  if (historyCache !== undefined) return historyCache;
  const value = readJson(HISTORY_KEY);
  historyCache = Array.isArray(value)
    ? value.filter(isRecord).map((record) => ({
        id: record.id,
        filename: record.filename,
        rows: Number(record.rows) || 0,
        columns: Number(record.columns) || 0,
        createdAt: String(record.createdAt ?? ""),
        expiresAt: String(record.expiresAt ?? ""),
      }))
    : EMPTY_HISTORY;
  return historyCache;
}

function getExpired(): ReadonlySet<string> {
  return expiredCache;
}

function getVersions(): SessionVersions {
  return versionsCache;
}

function setHistory(next: SessionRecord[]) {
  historyCache = next.slice(0, MAX_HISTORY);
  writeJson(HISTORY_KEY, historyCache);
}

export function setCurrentSession(value: CurrentSession | null) {
  currentCache = value;
  writeJson(CURRENT_KEY, value ?? { id: null }, "session");
  writeJson(LAST_KEY, value);
  versionsCache = INITIAL_VERSIONS;
  emit();
}

export function recordUpload(upload: UploadResponse): CurrentSession {
  const record: SessionRecord = {
    id: upload.session_id,
    filename: upload.filename,
    rows: upload.rows,
    columns: upload.columns,
    createdAt: upload.created_at,
    expiresAt: upload.expires_at,
  };
  setHistory([
    record,
    ...getSessionHistory().filter((item) => item.id !== record.id),
  ]);
  const current = { id: record.id, filename: record.filename };
  setCurrentSession(current);
  return current;
}

export function updateSessionRecord(
  id: string,
  patch: Partial<Omit<SessionRecord, "id">>,
) {
  const history = getSessionHistory();
  if (!history.some((item) => item.id === id)) return;
  setHistory(
    history.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  );
  emit();
}

export function forgetSessions(ids: string[]) {
  const remove = new Set(ids);
  setHistory(getSessionHistory().filter((item) => !remove.has(item.id)));
  const current = getCurrentSession();
  if (current && remove.has(current.id)) setCurrentSession(null);
  else emit();
}

export function forgetAllSessions() {
  setHistory([]);
  expiredCache = EMPTY_EXPIRED;
  setCurrentSession(null);
}

export function markSessionExpired(id: string) {
  if (expiredCache.has(id)) return;
  expiredCache = new Set([...expiredCache, id]);
  emit();
}

export function bumpDataVersion() {
  versionsCache = {
    data: versionsCache.data + 1,
    models: versionsCache.models,
  };
  emit();
}

export function bumpModelsVersion() {
  versionsCache = {
    data: versionsCache.data,
    models: versionsCache.models + 1,
  };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== HISTORY_KEY) return;
    historyCache = undefined;
    const current = getCurrentSession();
    if (
      current &&
      !getSessionHistory().some((item) => item.id === current.id)
    ) {
      setCurrentSession(null);
      return;
    }
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCurrentSession(): CurrentSession | null | undefined {
  return useSyncExternalStore<CurrentSession | null | undefined>(
    subscribe,
    getCurrentSession,
    () => undefined,
  );
}

export function useSessionHistory(): SessionRecord[] {
  return useSyncExternalStore(
    subscribe,
    getSessionHistory,
    () => EMPTY_HISTORY,
  );
}

export function useExpiredSessions(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getExpired, () => EMPTY_EXPIRED);
}

export function useSessionVersions(): SessionVersions {
  return useSyncExternalStore(subscribe, getVersions, () => INITIAL_VERSIONS);
}
