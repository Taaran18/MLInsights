import { LogoGlyph } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function AppLoader({
  title,
  description,
  steps,
  className,
}: {
  title: string;
  description?: string;
  steps?: string[];
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex min-h-[min(70dvh,40rem)] flex-col items-center justify-center overflow-hidden rounded-3xl px-6 py-16 text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_42%,var(--glow),transparent)]"
        aria-hidden="true"
      />
      <div className="relative size-28" aria-hidden="true">
        <div className="loader-ring absolute inset-0 rounded-full" />
        <div className="absolute inset-2.5 rounded-full bg-bg" />
        <div className="absolute inset-5 flex items-center justify-center rounded-[1.4rem] bg-linear-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-[0_12px_32px_-12px_rgb(234_88_12/0.9)]">
          <LogoGlyph className="loader-glyph size-[60%]" />
        </div>
      </div>
      <p className="relative mt-8 text-2xl font-bold tracking-tight text-fg">
        {title}
      </p>
      {description ? (
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      ) : null}
      <div
        className="relative mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-surface-3"
        aria-hidden="true"
      >
        <div className="loader-bar absolute inset-y-0 w-2/5 rounded-full bg-linear-to-r from-amber-400 via-orange-500 to-red-500" />
      </div>
      {steps?.length ? (
        <ul
          className="relative mt-7 flex flex-wrap justify-center gap-2"
          aria-hidden="true"
        >
          {steps.map((step, index) => (
            <li
              key={step}
              className="loader-step rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted"
              style={{ animationDelay: `${index * 450}ms` }}
            >
              {step}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="sr-only">{title}</span>
    </div>
  );
}
