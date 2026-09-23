import { useSyncExternalStore } from "react";
import type { ScalerType, TaskType } from "@/lib/api/types";
import { PREFERENCES_KEY } from "@/lib/boot-script";

export type Theme = "light" | "dark";

export interface Preferences {
  theme: Theme;
  sidebarPinned: boolean;
  reduceMotion: boolean;
  defaultTask: TaskType;
  defaultTestSize: number;
  defaultScaler: ScalerType;
  previewRows: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  sidebarPinned: false,
  reduceMotion: false,
  defaultTask: "classification",
  defaultTestSize: 0.2,
  defaultScaler: "standard",
  previewRows: 10,
};

const TASKS: TaskType[] = ["classification", "regression", "clustering"];
const SCALERS: ScalerType[] = ["none", "standard", "minmax", "robust"];
const PREVIEW_ROWS = [10, 25, 50, 100];

function sanitize(input: unknown): Preferences {
  const value = (
    input && typeof input === "object" ? input : {}
  ) as Partial<Preferences>;
  const testSize = Number(value.defaultTestSize);
  return {
    theme: value.theme === "light" ? "light" : "dark",
    sidebarPinned: value.sidebarPinned === true,
    reduceMotion: value.reduceMotion === true,
    defaultTask: TASKS.includes(value.defaultTask as TaskType)
      ? (value.defaultTask as TaskType)
      : DEFAULT_PREFERENCES.defaultTask,
    defaultTestSize:
      Number.isFinite(testSize) && testSize >= 0.1 && testSize <= 0.4
        ? Math.round(testSize * 100) / 100
        : DEFAULT_PREFERENCES.defaultTestSize,
    defaultScaler: SCALERS.includes(value.defaultScaler as ScalerType)
      ? (value.defaultScaler as ScalerType)
      : DEFAULT_PREFERENCES.defaultScaler,
    previewRows: PREVIEW_ROWS.includes(Number(value.previewRows))
      ? Number(value.previewRows)
      : DEFAULT_PREFERENCES.previewRows,
  };
}

let cache: Preferences | null = null;
const listeners = new Set<() => void>();

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    cache = sanitize(raw ? JSON.parse(raw) : {});
  } catch {
    cache = { ...DEFAULT_PREFERENCES };
  }
  return cache;
}

function setAttribute(
  element: HTMLElement,
  name: string,
  value: string | null,
) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function applyPreferencesToDocument(
  prefs: Preferences = readPreferences(),
) {
  const root = document.documentElement;
  root.setAttribute("data-js", "");
  root.setAttribute("data-theme", prefs.theme);
  setAttribute(root, "data-sidebar", prefs.sidebarPinned ? "pinned" : null);
  setAttribute(root, "data-motion", prefs.reduceMotion ? "reduce" : null);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", prefs.theme === "dark" ? "#000000" : "#ffffff");
}

function persist(next: Preferences) {
  cache = next;
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  } catch {}
  applyPreferencesToDocument(next);
  listeners.forEach((listener) => listener());
}

export function setPreferences(patch: Partial<Preferences>) {
  persist(sanitize({ ...readPreferences(), ...patch }));
}

export function resetWorkspaceDefaults() {
  const current = readPreferences();
  persist({
    ...DEFAULT_PREFERENCES,
    theme: current.theme,
    sidebarPinned: current.sidebarPinned,
    reduceMotion: current.reduceMotion,
  });
}

export function clearPreferences() {
  try {
    window.localStorage.removeItem(PREFERENCES_KEY);
  } catch {}
  persist({ ...DEFAULT_PREFERENCES });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PREFERENCES_KEY) return;
    cache = null;
    applyPreferencesToDocument(readPreferences());
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    subscribe,
    readPreferences,
    () => DEFAULT_PREFERENCES,
  );
}

export function setTheme(theme: Theme) {
  const apply = () => setPreferences({ theme });
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown;
  };
  const reduce =
    readPreferences().reduceMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(apply);
  else apply();
}
