import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type Tone =
  "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-surface-2 text-fg-muted",
  brand: "border-brand-line bg-brand-soft text-brand",
  success: "border-success-line bg-success-soft text-success",
  warning: "border-warning-line bg-warning-soft text-warning",
  danger: "border-danger-line bg-danger-soft text-danger",
  info: "border-info-line bg-info-soft text-info",
};

interface BadgeProps extends ComponentProps<"span"> {
  tone?: Tone;
  size?: "sm" | "md";
}

export function Badge({
  tone = "neutral",
  size = "sm",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function toneText(tone: Tone): string {
  return {
    neutral: "text-fg-muted",
    brand: "text-brand",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  }[tone];
}

export function toneSurface(tone: Tone): string {
  return tones[tone];
}
