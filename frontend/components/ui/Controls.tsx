"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function Switch({
  checked,
  onChange,
  disabled,
  id,
  ...aria
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-primary bg-primary"
          : "border-border-strong bg-surface-3",
      )}
      {...aria}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-5.5 rounded-full bg-white shadow-md transition-transform duration-200 ease-[var(--ease-spring)]",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

interface SwitchFieldProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: SwitchFieldProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-fg">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-sm text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      />
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  description,
  disabled,
  className,
  ...aria
}: CheckboxProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "group inline-flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-checked={indeterminate ? "mixed" : checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-md border border-border-strong bg-surface transition-colors checked:border-primary checked:bg-primary disabled:cursor-not-allowed"
          {...aria}
        />
        {indeterminate && !checked ? (
          <span className="pointer-events-none absolute inset-0 inline-flex items-center justify-center rounded-md bg-primary">
            <Minus className="size-3.5 text-white" aria-hidden="true" />
          </span>
        ) : (
          <Check
            className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            aria-hidden="true"
          />
        )}
      </span>
      {label || description ? (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-medium text-fg">{label}</span>
          ) : null}
          {description ? (
            <span className="block text-xs text-fg-muted">{description}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
  "aria-label": string;
}

function rovingKeyDown<T extends string>(
  event: KeyboardEvent<HTMLElement>,
  options: { value: T; disabled?: boolean }[],
  current: T,
  select: (value: T) => void,
  container: HTMLElement | null,
  itemSelector: string,
) {
  const keys = [
    "ArrowRight",
    "ArrowDown",
    "ArrowLeft",
    "ArrowUp",
    "Home",
    "End",
  ];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const enabled = options.filter((option) => !option.disabled);
  const index = enabled.findIndex((option) => option.value === current);
  let next = index;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = enabled.length - 1;
  else if (event.key === "ArrowRight" || event.key === "ArrowDown")
    next = (index + 1) % enabled.length;
  else next = (index - 1 + enabled.length) % enabled.length;
  const target = enabled[next];
  if (!target) return;
  select(target.value);
  container
    ?.querySelector<HTMLElement>(
      `${itemSelector}[data-value="${CSS.escape(target.value)}"]`,
    )
    ?.focus();
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  fullWidth = false,
  className,
  ...aria
}: SegmentedProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={aria["aria-label"]}
      onKeyDown={(event) =>
        rovingKeyDown(
          event,
          options,
          value,
          onChange,
          ref.current,
          '[role="radio"]',
        )
      }
      className={cn(
        "no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface-2 p-1",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-value={option.value}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
              size === "md" ? "h-9 px-4 text-sm" : "h-8 px-3 text-xs",
              fullWidth && "flex-1",
              selected
                ? "bg-surface text-fg shadow-card ring-1 ring-border"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: ReactNode; icon?: ReactNode; badge?: ReactNode }[];
  idPrefix: string;
  className?: string;
  "aria-label": string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  idPrefix,
  className,
  ...aria
}: TabsProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={aria["aria-label"]}
      onKeyDown={(event) =>
        rovingKeyDown(event, tabs, value, onChange, ref.current, '[role="tab"]')
      }
      className={cn(
        "no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface-2 p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.value}`}
            aria-controls={`${idPrefix}-panel`}
            aria-selected={selected}
            data-value={tab.value}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-4",
              selected
                ? "bg-surface text-fg shadow-card ring-1 ring-border"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idPrefix,
  value,
  children,
  className,
}: {
  idPrefix: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={0}
      className={cn("focus-visible:outline-offset-4", className)}
    >
      {children}
    </div>
  );
}

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  valueText?: string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  id,
  valueText,
  ...aria
}: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-valuetext={valueText}
      onChange={(event) => onChange(Number(event.target.value))}
      className="range"
      style={{ ["--range-fill" as string]: `${fill}%` }}
      {...aria}
    />
  );
}

interface ProgressProps {
  value: number;
  label: string;
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
  size?: "sm" | "md";
}

export function Progress({
  value,
  label,
  tone = "brand",
  className,
  size = "md",
}: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-3",
        size === "md" ? "h-2.5" : "h-1.5",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "brand" && "bg-linear-to-r from-indigo-500 to-violet-500",
          tone === "success" && "bg-emerald-500",
          tone === "warning" && "bg-amber-500",
          tone === "danger" && "bg-red-500",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
