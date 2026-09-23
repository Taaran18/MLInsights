"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Segmented } from "@/components/ui/Controls";
import {
  applyPreferencesToDocument,
  readPreferences,
  setTheme,
  usePreferences,
  type Theme,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

export function PreferencesSync() {
  useLayoutEffect(() => {
    applyPreferencesToDocument(readPreferences());
  }, []);
  return null;
}

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ThemeToggle({
  className,
  withLabel = false,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => setTheme(currentTheme() === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        withLabel ? "px-3.5 text-sm font-semibold" : "w-10",
        className,
      )}
    >
      <span className="theme-icon-dark inline-flex items-center gap-2">
        <Sun className="size-4.5" aria-hidden="true" />
        {withLabel ? (
          <span>Light Mode</span>
        ) : (
          <span className="sr-only">Switch to light mode</span>
        )}
      </span>
      <span className="theme-icon-light inline-flex items-center gap-2">
        <Moon className="size-4.5" aria-hidden="true" />
        {withLabel ? (
          <span>Dark Mode</span>
        ) : (
          <span className="sr-only">Switch to dark mode</span>
        )}
      </span>
    </button>
  );
}

export function ThemeSegmented({ fullWidth = false }: { fullWidth?: boolean }) {
  const { theme } = usePreferences();
  return (
    <Segmented
      aria-label="Color theme"
      value={theme}
      onChange={(value) => setTheme(value)}
      fullWidth={fullWidth}
      options={[
        { value: "light", label: "Light", icon: <Sun aria-hidden="true" /> },
        { value: "dark", label: "Dark", icon: <Moon aria-hidden="true" /> },
      ]}
    />
  );
}
