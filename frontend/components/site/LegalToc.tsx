"use client";

import { useScrollSpy } from "@/lib/use-scroll-spy";
import { cn } from "@/lib/utils";

export function LegalToc({
  items,
}: {
  items: { id: string; title: string }[];
}) {
  const current = useScrollSpy(
    items.map((item) => item.id),
    { offset: 140, fallbackToFirst: true },
  );

  return (
    <nav aria-label="On this page" className="sticky top-24">
      <p className="mb-3 px-3 text-xs font-semibold tracking-[0.16em] text-fg-subtle uppercase">
        On This Page
      </p>
      <ol className="space-y-0.5 border-l border-border">
        {items.map((item, index) => {
          const isActive = item.id === current;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px flex gap-2.5 border-l-2 py-2 pr-2 pl-4 text-sm transition-colors",
                  isActive
                    ? "border-primary font-semibold text-fg"
                    : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                <span className="num w-5 shrink-0 text-fg-subtle">
                  {index + 1}.
                </span>
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
