import type { Metadata } from "next";
import { ArrowLeft, Compass } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,black,transparent)]" />
        <div className="container-wide relative flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl border border-brand-line bg-brand-soft text-brand">
            <Compass className="size-7" aria-hidden="true" />
          </span>
          <p className="eyebrow mt-8">Error 404</p>
          <h1 className="mt-3 text-section font-extrabold text-fg">
            We Couldn&apos;t Find That Page
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-fg-muted">
            The link may be broken, or the page may have moved. Head back home
            or jump straight into the app.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/" variant="secondary" size="lg">
              <ArrowLeft aria-hidden="true" />
              Back to Home
            </ButtonLink>
            <ButtonLink href="/app" size="lg">
              Open the App
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
