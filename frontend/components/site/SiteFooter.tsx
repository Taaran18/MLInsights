import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  AUTHOR_NAME,
  CONTACT_EMAIL,
  REPO_URL,
  SESSION_TTL_HOURS,
  TOTAL_MODELS,
} from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#models", label: "Models" },
      { href: "/#faq", label: "FAQ" },
      { href: "/app", label: "Open the App" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-bg-alt">
      <div className="container-wide py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Explore, clean, and model any spreadsheet with {TOTAL_MODELS}{" "}
              machine-learning models, then export a full report. No code and no
              account needed.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-fg-subtle">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Uploaded data expires automatically after {SESSION_TTL_HOURS}{" "}
              hours.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-bold text-fg">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Project">
            <h2 className="text-sm font-bold text-fg">Project</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  Source Code on GitHub
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
              {CONTACT_EMAIL ? (
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    Contact
                  </a>
                </li>
              ) : null}
              <li>
                <Link
                  href="/app/settings"
                  className="text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  Manage Your Data
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} MLInsights. Built by {AUTHOR_NAME}.
          </p>
          <p>
            Model results are statistical estimates. Always validate before
            making decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
