import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toneSurface, type Tone } from "@/components/ui/Badge";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto flex max-w-3xl flex-col items-center text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h1 className="text-page font-extrabold text-fg">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {description}
        </p>
      ) : null}
      {meta ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {meta}
        </div>
      ) : null}
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  className,
  as = "h2",
}: SectionHeadingProps) {
  const Heading = as;
  return (
    <div
      className={cn(
        "mx-auto flex max-w-5xl flex-col items-center text-center",
        className,
      )}
      data-reveal
    >
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <Heading id={id} className="text-section font-extrabold text-fg">
        {title}
      </Heading>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon ? (
          <span
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-4",
              toneSurface(tone),
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="num mt-2 text-2xl font-bold tracking-tight text-fg sm:text-[1.7rem]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  labelId?: string;
  hint?: ReactNode;
  hintId?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  labelId,
  hint,
  hintId,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        id={labelId}
        htmlFor={htmlFor}
        className="text-sm font-semibold text-fg"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function revealDelay(index: number, step = 80): CSSProperties {
  return { ["--reveal-delay" as string]: `${index * step}ms` };
}

export function TableContainer({
  children,
  className,
  maxHeight = "28rem",
  label,
}: {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
  label: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "overflow-auto overscroll-x-contain rounded-xl border border-border bg-surface focus-visible:outline-offset-2",
        className,
      )}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}
