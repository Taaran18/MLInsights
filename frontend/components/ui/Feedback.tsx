import type { ReactNode } from "react";
import {
  CircleCheck,
  Info,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Spinner({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2.5 text-sm text-fg-muted",
        className,
      )}
    >
      <LoaderCircle
        className="size-5 animate-spin text-brand"
        aria-hidden="true"
      />
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton rounded-lg", className)} aria-hidden="true" />
  );
}

export function LoadingBlock({
  label,
  rows = 6,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      <Spinner label={label} />
      <div className="space-y-2.5">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-alt/60 text-center",
        compact ? "px-6 py-10" : "px-6 py-16 sm:py-20",
        className,
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-brand-line bg-brand-soft text-brand [&_svg]:size-6">
        {icon}
      </span>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-fg">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
  actions,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-danger-line bg-danger-soft px-6 py-12 text-center",
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-danger-line bg-surface text-danger">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-fg">{title}</h2>
      <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-fg-muted">
        {message}
      </p>
      {onRetry || actions ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              {retryLabel}
            </Button>
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

type CalloutTone = "info" | "success" | "warning" | "danger" | "brand";

const calloutStyles: Record<CalloutTone, { box: string; icon: ReactNode }> = {
  info: {
    box: "border-info-line bg-info-soft [&_.callout-icon]:text-info",
    icon: <Info />,
  },
  brand: {
    box: "border-brand-line bg-brand-soft [&_.callout-icon]:text-brand",
    icon: <Info />,
  },
  success: {
    box: "border-success-line bg-success-soft [&_.callout-icon]:text-success",
    icon: <CircleCheck />,
  },
  warning: {
    box: "border-warning-line bg-warning-soft [&_.callout-icon]:text-warning",
    icon: <TriangleAlert />,
  },
  danger: {
    box: "border-danger-line bg-danger-soft [&_.callout-icon]:text-danger",
    icon: <TriangleAlert />,
  },
};

interface CalloutProps {
  tone?: CalloutTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Callout({
  tone = "info",
  title,
  children,
  action,
  icon,
  className,
}: CalloutProps) {
  const style = calloutStyles[tone];
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        style.box,
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="callout-icon mt-0.5 shrink-0 [&_svg]:size-5"
          aria-hidden="true"
        >
          {icon ?? style.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">{title}</p>
          {children ? (
            <div className="mt-0.5 text-sm text-fg-muted">{children}</div>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
