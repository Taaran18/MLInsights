"use client";

import { useEffect } from "react";
import { House, RefreshCw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="container-wide flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center"
    >
      <span className="inline-flex size-16 items-center justify-center rounded-2xl border border-danger-line bg-danger-soft text-danger">
        <TriangleAlert className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-8 text-page font-extrabold text-fg">
        Something Went Wrong
      </h1>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-fg-muted">
        This page hit an unexpected problem. Try again, and if it keeps
        happening, reload the page or go back home.
      </p>
      {error.digest ? (
        <p className="num mt-3 text-xs text-fg-subtle">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => retry()}>
          <RefreshCw aria-hidden="true" />
          Try Again
        </Button>
        <ButtonLink href="/" variant="secondary" size="lg">
          <House aria-hidden="true" />
          Back to Home
        </ButtonLink>
      </div>
    </main>
  );
}
