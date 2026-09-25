import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="4.25"
        y="14"
        width="3.5"
        height="6"
        rx="1.2"
        fill="currentColor"
        fillOpacity="0.72"
      />
      <rect
        x="10.25"
        y="10"
        width="3.5"
        height="10"
        rx="1.2"
        fill="currentColor"
        fillOpacity="0.86"
      />
      <rect
        x="16.25"
        y="5.5"
        width="3.5"
        height="14.5"
        rx="1.2"
        fill="currentColor"
      />
      <path
        d="M7 3.2l.85 2.35L10.2 6.4l-2.35.85L7 9.6l-.85-2.35L3.8 6.4l2.35-.85L7 3.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-linear-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_20px_-10px_rgb(234_88_12/0.9)]",
        className,
      )}
    >
      <LogoGlyph className="size-[62%]" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("text-lg font-extrabold tracking-tight text-fg", className)}
    >
      ML<span className="text-brand">Insights</span>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
  hideWordmark = false,
}: {
  href?: string;
  className?: string;
  hideWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-xl", className)}
      aria-label="MLInsights home"
    >
      <LogoMark />
      {hideWordmark ? null : <Wordmark />}
    </Link>
  );
}
