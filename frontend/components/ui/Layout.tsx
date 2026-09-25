import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/Badge";

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

export type Accent =
  "orange" | "amber" | "sky" | "emerald" | "rose" | "violet" | "teal" | "slate";

const ACCENTS: Record<Accent, { card: string; icon: string; glow: string }> = {
  orange: {
    card: "border-orange-500/25 from-orange-500/[0.13]",
    icon: "from-amber-400 to-orange-500 shadow-orange-500/30",
    glow: "bg-orange-500/25",
  },
  amber: {
    card: "border-amber-500/25 from-amber-400/[0.14]",
    icon: "from-yellow-400 to-amber-500 shadow-amber-500/30",
    glow: "bg-amber-400/25",
  },
  sky: {
    card: "border-sky-500/25 from-sky-500/[0.13]",
    icon: "from-sky-400 to-blue-500 shadow-sky-500/30",
    glow: "bg-sky-500/25",
  },
  emerald: {
    card: "border-emerald-500/25 from-emerald-500/[0.13]",
    icon: "from-emerald-400 to-teal-500 shadow-emerald-500/30",
    glow: "bg-emerald-500/25",
  },
  rose: {
    card: "border-rose-500/25 from-rose-500/[0.13]",
    icon: "from-rose-400 to-red-500 shadow-rose-500/30",
    glow: "bg-rose-500/25",
  },
  violet: {
    card: "border-violet-500/25 from-violet-500/[0.13]",
    icon: "from-violet-400 to-fuchsia-500 shadow-violet-500/30",
    glow: "bg-violet-500/25",
  },
  teal: {
    card: "border-teal-500/25 from-teal-500/[0.13]",
    icon: "from-teal-400 to-cyan-500 shadow-teal-500/30",
    glow: "bg-teal-500/25",
  },
  slate: {
    card: "border-slate-500/25 from-slate-500/[0.12]",
    icon: "from-slate-400 to-slate-600 shadow-slate-500/30",
    glow: "bg-slate-500/20",
  },
};

const TONE_ACCENT: Record<Tone, Accent> = {
  brand: "orange",
  info: "sky",
  success: "emerald",
  warning: "amber",
  danger: "rose",
  neutral: "slate",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  accent?: Accent;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  accent,
  className,
}: StatCardProps) {
  const palette = ACCENTS[accent ?? TONE_ACCENT[tone]];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-linear-to-br via-surface to-surface p-4 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5",
        palette.card,
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 size-36 rounded-full opacity-70 blur-2xl transition-opacity group-hover:opacity-100",
          palette.glow,
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-fg-muted">{label}</p>
        {icon ? (
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg [&_svg]:size-[1.15rem]",
              palette.icon,
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="num relative mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight text-fg sm:text-[2rem]">
        {value}
      </p>
      {hint ? (
        <p className="relative mt-1 text-xs font-medium text-fg-subtle">
          {hint}
        </p>
      ) : null}
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
        "relative overflow-auto overscroll-x-contain rounded-xl border border-border bg-surface focus-visible:outline-offset-2",
        className,
      )}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}
