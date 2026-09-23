"use client";

import { useId, useState, type ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

type ConfirmTone = "danger" | "warning" | "primary" | "success";

const toneIcon: Record<ConfirmTone, { icon: ReactNode; className: string }> = {
  danger: {
    icon: <TriangleAlert className="size-5" aria-hidden="true" />,
    className: "bg-danger-soft text-danger border-danger-line",
  },
  warning: {
    icon: <TriangleAlert className="size-5" aria-hidden="true" />,
    className: "bg-warning-soft text-warning border-warning-line",
  },
  primary: {
    icon: <Info className="size-5" aria-hidden="true" />,
    className: "bg-brand-soft text-brand border-brand-line",
  },
  success: {
    icon: <CircleCheck className="size-5" aria-hidden="true" />,
    className: "bg-success-soft text-success border-success-line",
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  children?: ReactNode;
  requireText?: string;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  busyLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  children,
  requireText,
}: ConfirmDialogProps) {
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const locked = Boolean(requireText) && typed.trim() !== requireText;
  const { icon, className } = toneIcon[tone];
  const destructive = tone === "danger";

  const close = () => {
    if (busy) return;
    setTyped("");
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      dismissible={!busy}
      title={title}
      description={description}
      icon={
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl border",
            className,
          )}
        >
          {icon}
        </span>
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={close}
            disabled={busy}
            data-autofocus={destructive || undefined}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={() => {
              if (locked) return;
              void Promise.resolve(onConfirm()).then(() => setTyped(""));
            }}
            loading={busy}
            loadingText={busyLabel}
            disabled={locked}
            data-autofocus={!destructive && !requireText ? true : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children || requireText ? (
        <div className="space-y-4">
          {children}
          {requireText ? (
            <div>
              <label
                htmlFor={inputId}
                className="mb-1.5 block text-sm text-fg-muted"
              >
                Type{" "}
                <span className="num font-semibold text-fg">{requireText}</span>{" "}
                to confirm.
              </label>
              <input
                id={inputId}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                data-autofocus
                className="num h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-fg outline-none focus-visible:outline-2"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
