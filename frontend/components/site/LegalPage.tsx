import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Scale } from "lucide-react";
import { LegalToc } from "@/components/site/LegalToc";
import { revealDelay } from "@/components/ui/Layout";
import {
  LEGAL_UPDATED,
  LEGAL_UPDATED_ISO,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export interface LegalHighlight {
  icon: ReactNode;
  title: string;
  description: string;
}

interface LegalPageProps {
  title: string;
  path: string;
  description: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
}

const OTHER_PAGES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function LegalPage({
  title,
  path,
  description,
  highlights,
  sections,
}: LegalPageProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: `${title} · ${SITE_NAME}`,
        description,
        dateModified: LEGAL_UPDATED_ISO,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "en-US",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: `${SITE_URL}${path}`,
          },
        ],
      },
    ],
  };

  const toc = sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="section-alt relative -mt-16 overflow-hidden border-b border-border pt-16">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,black,transparent)]" />
        <div className="container-wide relative py-16 text-center sm:py-20 lg:py-24">
          <nav
            aria-label="Breadcrumb"
            data-reveal="fade"
            className="flex justify-center"
          >
            <ol className="flex items-center gap-2 text-sm text-fg-subtle">
              <li>
                <Link href="/" className="transition-colors hover:text-fg">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg-muted">
                {title}
              </li>
            </ol>
          </nav>
          <p data-reveal="fade" className="eyebrow mt-6">
            <Scale className="size-4" aria-hidden="true" />
            Legal
          </p>
          <h1
            data-reveal
            style={revealDelay(1)}
            className="mt-4 text-section font-extrabold text-fg"
          >
            {title}
          </h1>
          <p
            data-reveal
            style={revealDelay(2)}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg"
          >
            {description}
          </p>
          <p
            data-reveal
            style={revealDelay(3)}
            className="mt-4 text-sm text-fg-subtle"
          >
            Last updated{" "}
            <time dateTime={LEGAL_UPDATED_ISO}>{LEGAL_UPDATED}</time>
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-16" aria-labelledby="glance-title">
        <div className="container-wide">
          <h2
            id="glance-title"
            className="text-center text-2xl font-bold tracking-tight text-fg sm:text-3xl"
          >
            At a Glance
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item, index) => (
              <div key={item.title} data-reveal style={revealDelay(index)}>
                <div className="h-full rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand [&_svg]:size-5">
                    {item.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-fg">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-wide pb-24 lg:pb-32">
        <details className="group mb-8 rounded-2xl border border-border bg-surface lg:hidden">
          <summary className="flex list-none items-center justify-between px-5 py-4 font-semibold text-fg">
            On This Page
            <ChevronDown
              className="size-5 text-fg-subtle transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ol className="space-y-1 border-t border-border p-3">
            {toc.map((item, index) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <span className="num w-5 text-fg-subtle">{index + 1}.</span>
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </details>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-14">
          <aside className="hidden lg:block">
            <LegalToc items={toc} />
          </aside>

          <article className="space-y-5">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className={cn(
                  "rounded-2xl border border-border p-6 sm:p-8",
                  index % 2 === 0 ? "bg-surface shadow-card" : "bg-bg-alt",
                )}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="num inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand-line bg-brand-soft text-sm font-bold text-brand">
                    {index + 1}
                  </span>
                  <h2
                    id={`${section.id}-title`}
                    className="min-w-0 text-xl font-bold tracking-tight text-fg sm:text-2xl"
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-3 leading-relaxed text-fg-muted sm:pl-13 [&_a]:font-semibold [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {section.content}
                </div>
              </section>
            ))}

            <nav
              aria-label="Other legal pages"
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-semibold text-fg">Related Pages</p>
              <ul className="flex flex-wrap gap-2">
                {OTHER_PAGES.filter((page) => page.href !== path).map(
                  (page) => (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-fg transition-colors hover:border-brand-line hover:text-brand"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          </article>
        </div>
      </div>
    </>
  );
}
