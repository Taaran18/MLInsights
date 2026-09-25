"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  CloudUpload,
  Database,
  FileSpreadsheet,
  Menu,
  Settings,
  TimerOff,
  WifiOff,
} from "lucide-react";
import { AppLoader } from "@/components/app/AppLoader";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ThemeSegmented, ThemeToggle } from "@/components/theme/ThemeControls";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Dialog";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import {
  GENERAL_NAV,
  WORKFLOW_NAV,
  findNavItem,
  isActivePath,
} from "@/lib/nav";
import { useSession } from "@/lib/session";
import { SESSION_TTL_HOURS } from "@/lib/site";
import { cn, formatCompact, countLabel } from "@/lib/utils";

function DatasetChip() {
  const { session, overview, status } = useSession();
  if (!session) return null;
  return (
    <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pr-3 pl-2 md:flex">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <FileSpreadsheet className="size-4" aria-hidden="true" />
      </span>
      <span
        className="max-w-64 truncate text-sm font-semibold text-fg"
        title={session.filename}
      >
        {session.filename}
      </span>
      {status === "ready" && overview ? (
        <>
          <span className="num hidden text-xs text-fg-subtle xl:inline">
            {formatCompact(overview.rows)} × {overview.columns}
          </span>
          {overview.is_cleaned ? <Badge tone="success">Cleaned</Badge> : null}
        </>
      ) : null}
      {status === "expired" ? <Badge tone="danger">Expired</Badge> : null}
    </div>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { session, overview, status } = useSession();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="left"
      title="Navigation"
      hideHeader
      label="Navigation"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-2 hover:text-fg"
            aria-label="Close navigation"
            data-autofocus
          >
            <ChevronRight className="size-5 rotate-180" aria-hidden="true" />
          </button>
        </div>
        <nav
          aria-label="Workspace navigation"
          className="flex-1 overflow-y-auto p-3"
        >
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] text-fg-subtle uppercase">
            Workflow
          </p>
          <ul className="space-y-1">
            {[...WORKFLOW_NAV, ...GENERAL_NAV].map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold transition-colors",
                      active
                        ? "bg-brand-soft text-brand"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          {session ? (
            <div className="rounded-xl border border-border bg-surface-2 p-3">
              <p className="truncate text-sm font-semibold text-fg">
                {session.filename}
              </p>
              <p className="num text-xs text-fg-subtle">
                {status === "ready" && overview
                  ? `${countLabel(overview.rows, "row", "rows", true)} · ${countLabel(overview.columns, "column")}`
                  : status === "expired"
                    ? "Session expired"
                    : "Loading…"}
              </p>
            </div>
          ) : null}
          <ThemeSegmented fullWidth />
        </div>
      </div>
    </Sheet>
  );
}

export function AppTopBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = findNavItem(pathname);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="container-app flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-fg-muted hover:text-fg lg:hidden"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Link
          href="/"
          aria-label="MLInsights home"
          className="shrink-0 rounded-xl lg:hidden"
        >
          <LogoMark className="size-8" />
        </Link>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            <li className="hidden text-fg-subtle sm:block">Workspace</li>
            <li aria-hidden="true" className="hidden text-fg-subtle sm:block">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="truncate font-semibold text-fg">
              {current?.label ?? "Workspace"}
            </li>
          </ol>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <DatasetChip />
          {pathname !== "/app" ? (
            <ButtonLink
              href="/app"
              variant="secondary"
              size="sm"
              className="hidden h-10 sm:inline-flex"
            >
              <CloudUpload aria-hidden="true" />
              New Dataset
            </ButtonLink>
          ) : null}
          <Link
            href="/app/settings"
            aria-label="Settings"
            className="hidden size-10 items-center justify-center rounded-xl border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg sm:inline-flex lg:hidden"
          >
            <Settings className="size-4.5" aria-hidden="true" />
          </Link>
          <ThemeToggle className="lg:hidden" />
        </div>
      </div>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

export function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, error, reload } = useSession();
  const route = findNavItem(pathname);
  if (!route?.requiresSession) return <>{children}</>;

  switch (status) {
    case "restoring":
      return (
        <AppLoader
          title="Restoring Your Workspace"
          description="Picking up where you left off."
        />
      );
    case "loading":
      return (
        <AppLoader
          title="Loading Your Dataset"
          description="Reading the file, profiling every column, and preparing your workspace."
          steps={["Reading rows", "Detecting types", "Profiling columns"]}
        />
      );
    case "empty":
      return (
        <EmptyState
          icon={<Database aria-hidden="true" />}
          title="No Dataset Loaded"
          description={`${route.label} needs a dataset. Upload a CSV or Excel file, or try one of the sample datasets, to get started.`}
          actions={
            <ButtonLink href="/app">
              <CloudUpload aria-hidden="true" />
              Upload a Dataset
            </ButtonLink>
          }
        />
      );
    case "expired":
      return (
        <EmptyState
          icon={<TimerOff aria-hidden="true" />}
          title="This Session Has Expired"
          description={`Datasets expire ${SESSION_TTL_HOURS} hours after upload and can also be deleted from Settings. Upload your file again to pick up where you left off.`}
          actions={
            <>
              <ButtonLink href="/app">
                <CloudUpload aria-hidden="true" />
                Upload Again
              </ButtonLink>
              <ButtonLink href="/app/settings#sessions" variant="secondary">
                Manage Sessions
              </ButtonLink>
            </>
          }
        />
      );
    case "error":
      return (
        <ErrorState
          title="We Couldn't Load Your Dataset"
          message={error?.message ?? "The analysis server didn't respond."}
          onRetry={reload}
          actions={
            <ButtonLink href="/app/settings#connection" variant="ghost">
              <WifiOff aria-hidden="true" />
              Check Connection
            </ButtonLink>
          }
        />
      );
    default:
      return <>{children}</>;
  }
}

export function NextStep({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-[border-color,box-shadow] hover:border-brand-line hover:shadow-card-hover sm:p-6"
    >
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand [&_svg]:size-5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
          Next Step
        </span>
        <span className="mt-0.5 block text-lg font-bold tracking-tight text-fg">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-fg-muted">
          {description}
        </span>
      </span>
      <ArrowRight
        className="size-5 shrink-0 text-fg-subtle transition-[color,translate] group-hover:translate-x-1 group-hover:text-brand"
        aria-hidden="true"
      />
    </Link>
  );
}
