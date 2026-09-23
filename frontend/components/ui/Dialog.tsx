"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-3xl",
};

function useNativeDialog(
  open: boolean,
  dismissible: boolean,
  onClose: () => void,
) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  const pointerStartedOnBackdrop = useRef(false);

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return {
    ref,
    handlers: {
      onCancel: (event: React.SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault();
        if (dismissible) onClose();
      },
      onClose: () => {
        if (!openRef.current) return;
        if (dismissible) onClose();
        else ref.current?.showModal();
      },
      onPointerDown: (event: React.PointerEvent<HTMLDialogElement>) => {
        pointerStartedOnBackdrop.current = event.target === event.currentTarget;
      },
      onClick: (event: React.MouseEvent<HTMLDialogElement>) => {
        if (
          dismissible &&
          pointerStartedOnBackdrop.current &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
        pointerStartedOnBackdrop.current = false;
      },
    },
  };
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  dismissible?: boolean;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  dismissible = true,
  className,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { ref, handlers } = useNativeDialog(open, dismissible, onClose);

  return (
    <dialog
      ref={ref}
      className={cn("modal", sizes[size])}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      {...handlers}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-pop",
          className,
        )}
      >
        <div className="flex items-start gap-4 px-6 pt-6">
          {icon ? <div className="shrink-0">{icon}</div> : null}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id={titleId}
              className="text-xl font-bold tracking-tight text-fg"
            >
              {title}
            </h2>
            {description ? (
              <div
                id={descriptionId}
                className="mt-1.5 text-sm leading-relaxed text-fg-muted"
              >
                {description}
              </div>
            ) : null}
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Close dialog"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {children ? (
          <div className="min-h-0 overflow-y-auto px-6 pt-5">{children}</div>
        ) : null}
        {footer ? (
          <div className="flex flex-col-reverse gap-2 px-6 pt-6 pb-6 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>
    </dialog>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  headerExtra?: ReactNode;
  bodyClassName?: string;
  hideHeader?: boolean;
  label?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  headerExtra,
  bodyClassName,
  hideHeader = false,
  label,
}: SheetProps) {
  const titleId = useId();
  const { ref, handlers } = useNativeDialog(open, true, onClose);

  return (
    <dialog
      ref={ref}
      className="sheet"
      data-side={side}
      aria-labelledby={hideHeader ? undefined : titleId}
      aria-label={hideHeader ? label : undefined}
      {...handlers}
    >
      <div
        className={cn(
          "flex h-full flex-col border-border bg-surface shadow-2xl",
          side === "right" ? "border-l" : "border-r",
        )}
      >
        {hideHeader ? null : (
          <div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="truncate text-lg font-bold tracking-tight text-fg"
              >
                {title}
              </h2>
              {description ? (
                <div className="mt-1 text-sm text-fg-muted">{description}</div>
              ) : null}
              {headerExtra}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Close panel"
              data-autofocus
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
