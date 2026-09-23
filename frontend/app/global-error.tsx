"use client";

import { BOOT_SCRIPT } from "@/lib/boot-script";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <title>Something Went Wrong · MLInsights</title>
      </head>
      <body className="flex min-h-dvh items-center justify-center bg-bg p-6 text-fg">
        <main className="max-w-lg text-center">
          <h1 className="text-page font-extrabold">Something Went Wrong</h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            MLInsights ran into an unexpected problem while loading. Try again,
            or reload the page.
          </p>
          {error.digest ? (
            <p className="num mt-3 text-xs text-fg-subtle">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:bg-primary-hover"
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  );
}
