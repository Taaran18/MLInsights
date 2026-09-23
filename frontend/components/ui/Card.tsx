import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends ComponentProps<"div"> {
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-card",
        interactive &&
          "transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-brand-line hover:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}

interface PanelProps extends Omit<ComponentProps<"section">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  bodyClassName?: string;
  headingLevel?: "h2" | "h3";
}

export function Panel({
  title,
  description,
  icon,
  actions,
  className,
  bodyClassName,
  headingLevel = "h2",
  children,
  ...props
}: PanelProps) {
  const Heading = headingLevel;
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-card",
        className,
      )}
      {...props}
    >
      <header className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand [&_svg]:size-4.5">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <Heading className="text-lg font-bold tracking-tight text-fg">
              {title}
            </Heading>
            {description ? (
              <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
