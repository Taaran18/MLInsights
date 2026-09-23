"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeSegmented, ThemeToggle } from "@/components/theme/ThemeControls";
import { ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Dialog";
import { useScrollSpy } from "@/lib/use-scroll-spy";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", id: "features", label: "Features" },
  { href: "/#how-it-works", id: "how-it-works", label: "How It Works" },
  { href: "/#models", id: "models", label: "Models" },
  { href: "/#privacy", id: "privacy", label: "Privacy" },
  { href: "/#faq", id: "faq", label: "FAQ" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeId = useScrollSpy(
    NAV_LINKS.map((link) => link.id),
    { offset: "40%", mode: "inside", watch: pathname },
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) =>
      setScrolled(!entry.isIntersecting),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const currentId = pathname === "/" ? activeId : null;

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-2"
      />
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-border bg-bg/80 backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-wide flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={currentId === link.id ? "location" : undefined}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  currentId === link.id
                    ? "bg-surface-2 text-fg"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink
              href="/app"
              size="sm"
              className="hidden h-10 sm:inline-flex"
            >
              Open the App
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-fg-muted hover:text-fg lg:hidden"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <Sheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          side="right"
          title="Menu"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-semibold text-fg transition-colors hover:bg-surface-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-4 border-t border-border p-4">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">
                Theme
              </p>
              <ThemeSegmented fullWidth />
            </div>
            <ButtonLink
              href="/app"
              className="w-full"
              onClick={() => setMenuOpen(false)}
            >
              Open the App
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
        </Sheet>
      </header>
    </>
  );
}
