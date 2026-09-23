import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "danger" | "danger-soft" | "brand-soft";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_10px_24px_-12px_rgb(79_70_229/0.8)] hover:bg-primary-hover",
  secondary:
    "border border-border bg-surface text-fg shadow-card hover:border-border-strong hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger-solid text-white shadow-sm hover:bg-danger-solid-hover",
  "danger-soft":
    "border border-danger-line bg-danger-soft text-danger hover:border-danger",
  "brand-soft":
    "border border-brand-line bg-brand-soft text-brand hover:border-brand",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm [&_svg]:size-4",
  md: "h-11 px-5 text-sm [&_svg]:size-4",
  lg: "h-13 px-7 text-base [&_svg]:size-5",
  icon: "size-11 [&_svg]:size-5",
  "icon-sm": "size-9 rounded-lg [&_svg]:size-4",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : null}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props} />
  );
}
