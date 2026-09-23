"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, Pin, PinOff } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeControls";
import {
  GENERAL_NAV,
  WORKFLOW_NAV,
  isActivePath,
  type AppNavItem,
} from "@/lib/nav";
import { setPreferences, usePreferences } from "@/lib/preferences";
import { useSession } from "@/lib/session";
import { cn, countLabel } from "@/lib/utils";

const ENTER_DELAY = 90;
const LEAVE_DELAY = 220;

function NavBadge({ item }: { item: AppNavItem }) {
  const { overview, status } = useSession();
  if (status !== "ready" || !overview) return null;
  if (item.href === "/app/clean" && overview.is_cleaned) {
    return (
      <span className="rounded-full border border-success-line bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
        Cleaned
      </span>
    );
  }
  if (
    (item.href === "/app/results" || item.href === "/app/compare") &&
    overview.trained_models > 0
  ) {
    return (
      <span className="num rounded-full border border-brand-line bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
        {overview.trained_models}
      </span>
    );
  }
  return null;
}

function NavLink({
  item,
  pathname,
  expanded,
}: {
  item: AppNavItem;
  pathname: string;
  expanded: boolean;
}) {
  const { status } = useSession();
  const active = isActivePath(pathname, item.href);
  const unavailable = item.requiresSession && status !== "ready";
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group/link relative flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-colors",
          active
            ? "bg-brand-soft text-brand"
            : "text-fg-muted hover:bg-surface-2 hover:text-fg",
          unavailable && !active && "opacity-60",
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-primary"
          />
        ) : null}
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span
          className={cn(
            "flex min-w-0 flex-1 items-center justify-between gap-2 transition-opacity duration-200",
            expanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <span className="truncate">{item.label}</span>
          <NavBadge item={item} />
        </span>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarPinned } = usePreferences();
  const { status, overview, session } = useSession();
  const [hovered, setHovered] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const peeking = !sidebarPinned && (hovered || keyboardFocus);
  const expanded = sidebarPinned || peeking;

  useEffect(() => {
    document.documentElement.toggleAttribute("data-sidebar-peek", peeking);
  }, [peeking]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      document.documentElement.removeAttribute("data-sidebar-peek");
    },
    [],
  );

  const schedule = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHovered(next), delay);
  };

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(":focus-visible")) setKeyboardFocus(true);
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
      setKeyboardFocus(false);
  };

  const togglePin = () => {
    setPreferences({ sidebarPinned: !sidebarPinned });
    window.clearTimeout(timer.current);
    setHovered(false);
  };

  return (
    <aside
      aria-label="Workspace"
      data-expanded={expanded}
      onMouseEnter={() => schedule(true, ENTER_DELAY)}
      onMouseLeave={() => schedule(false, LEAVE_DELAY)}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        "sidebar fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-border bg-surface lg:flex",
        peeking && "shadow-pop",
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5">
        <Link
          href="/"
          aria-label="MLInsights home"
          className="shrink-0 rounded-xl"
        >
          <LogoMark />
        </Link>
        <span
          className={cn(
            "min-w-0 flex-1 transition-opacity duration-200",
            expanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Wordmark className="text-base" />
        </span>
        <button
          type="button"
          onClick={togglePin}
          aria-pressed={sidebarPinned}
          aria-label={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
          title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
          tabIndex={expanded ? 0 : -1}
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-[opacity,background-color,color] duration-200",
            sidebarPinned
              ? "bg-brand-soft text-brand"
              : "text-fg-subtle hover:bg-surface-2 hover:text-fg",
            expanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {sidebarPinned ? (
            <PinOff className="size-4" aria-hidden="true" />
          ) : (
            <Pin className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav
        aria-label="Workspace navigation"
        className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-5"
      >
        <p
          className={cn(
            "mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] whitespace-nowrap text-fg-subtle uppercase transition-opacity",
            expanded ? "opacity-100" : "opacity-0",
          )}
        >
          Workflow
        </p>
        <ul className="space-y-1">
          {WORKFLOW_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              expanded={expanded}
            />
          ))}
        </ul>
        <div className="mx-2 my-5 border-t border-border" />
        <ul className="space-y-1">
          {GENERAL_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              expanded={expanded}
            />
          ))}
        </ul>
      </nav>

      <div className="shrink-0 space-y-3 border-t border-border p-3">
        {session ? (
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-surface-2 p-2.5 transition-opacity",
              expanded ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!expanded}
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <FileSpreadsheet className="size-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-fg">
                {session.filename}
              </span>
              <span className="num block truncate text-xs text-fg-subtle">
                {status === "ready" && overview
                  ? `${countLabel(overview.rows, "row", "rows", true)} · ${countLabel(overview.columns, "column")}`
                  : status === "expired"
                    ? "Session expired"
                    : "Loading…"}
              </span>
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle className="size-10" />
          <span
            className={cn(
              "text-xs whitespace-nowrap text-fg-subtle transition-opacity",
              expanded ? "opacity-100" : "opacity-0",
            )}
          >
            Switch theme
          </span>
        </div>
      </div>
    </aside>
  );
}
