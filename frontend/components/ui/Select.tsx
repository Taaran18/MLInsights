"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  meta?: string;
}

interface SelectProps<T extends string> {
  value: T | null;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  align?: "start" | "end";
  minMenuWidth?: number;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const GAP = 6;
const MARGIN = 12;

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchable = false,
  searchPlaceholder = "Search…",
  emptyMessage = "No matches found.",
  disabled = false,
  size = "md",
  align = "start",
  minMenuWidth = 220,
  className,
  id,
  ...aria
}: SelectProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const listboxId = `${generatedId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!searchable || !term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term) ||
        option.meta?.toLowerCase().includes(term),
    );
  }, [options, query, searchable]);

  const measure = useCallback((): MenuPosition | null => {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const width = Math.min(
      Math.max(rect.width, minMenuWidth),
      window.innerWidth - MARGIN * 2,
    );
    const spaceBelow = viewportHeight - rect.bottom - MARGIN - GAP;
    const spaceAbove = rect.top - MARGIN - GAP;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      140,
      Math.min(360, openUp ? spaceAbove : spaceBelow),
    );
    const preferredLeft = align === "end" ? rect.right - width : rect.left;
    const left = Math.min(
      Math.max(MARGIN, preferredLeft),
      window.innerWidth - width - MARGIN,
    );
    return openUp
      ? { bottom: viewportHeight - rect.top + GAP, left, width, maxHeight }
      : { top: rect.bottom + GAP, left, width, maxHeight };
  }, [align, minMenuWidth]);

  const firstEnabled = useCallback(
    (list: SelectOption<T>[], from = 0, step = 1) => {
      for (let i = from; i >= 0 && i < list.length; i += step) {
        if (!list[i].disabled) return i;
      }
      return -1;
    },
    [],
  );

  const openMenu = useCallback(() => {
    if (disabled) return;
    const trigger = triggerRef.current;
    setHost(
      (trigger?.closest("dialog") as HTMLElement | null) ?? document.body,
    );
    setPosition(measure());
    setQuery("");
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(options));
    setOpen(true);
  }, [disabled, firstEnabled, measure, options, value]);

  const closeMenu = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const choose = useCallback(
    (option: SelectOption<T> | undefined) => {
      if (!option || option.disabled) return;
      onChange(option.value);
      closeMenu();
    },
    [closeMenu, onChange],
  );

  useEffect(() => {
    if (!open) return;
    (searchable ? searchRef.current : listRef.current)?.focus({
      preventScroll: true,
    });
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const onReposition = (event: Event) => {
      if (
        event.type === "scroll" &&
        menuRef.current?.contains(event.target as Node)
      )
        return;
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        return;
      }
      setPosition(measure());
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [measure, open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const moveActive = (step: 1 | -1) => {
    if (filtered.length === 0) return;
    let next = activeIndex;
    for (let i = 0; i < filtered.length; i += 1) {
      next = (next + step + filtered.length) % filtered.length;
      if (!filtered[next].disabled) break;
    }
    setActiveIndex(next);
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        return;
      case "Home":
        if (searchable && event.currentTarget === searchRef.current) return;
        event.preventDefault();
        setActiveIndex(firstEnabled(filtered));
        return;
      case "End":
        if (searchable && event.currentTarget === searchRef.current) return;
        event.preventDefault();
        setActiveIndex(firstEnabled(filtered, filtered.length - 1, -1));
        return;
      case "Enter":
        event.preventDefault();
        choose(filtered[activeIndex]);
        return;
      case " ":
        if (searchable) return;
        event.preventDefault();
        choose(filtered[activeIndex]);
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        if (
          !searchable &&
          event.key.length === 1 &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          window.clearTimeout(typeahead.current.timer);
          typeahead.current.text += event.key.toLowerCase();
          typeahead.current.timer = window.setTimeout(() => {
            typeahead.current.text = "";
          }, 500);
          const match = filtered.findIndex(
            (option) =>
              !option.disabled &&
              option.label.toLowerCase().startsWith(typeahead.current.text),
          );
          if (match >= 0) setActiveIndex(match);
        }
    }
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    }
  };

  const activeId = activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;

  const menu =
    open && position && host
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-80 flex animate-fade-in flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {searchable ? (
              <div className="relative border-b border-border p-2">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-fg-subtle"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listboxId}
                  aria-activedescendant={activeId}
                  aria-autocomplete="list"
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onMenuKeyDown}
                  className="h-10 w-full rounded-lg bg-surface-2 pr-3 pl-9 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-2"
                />
              </div>
            ) : null}
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={triggerId}
              aria-activedescendant={searchable ? undefined : activeId}
              onKeyDown={searchable ? undefined : onMenuKeyDown}
              className="overflow-y-auto overscroll-contain p-1.5 outline-none"
            >
              {filtered.length === 0 ? (
                <li
                  className="px-3 py-6 text-center text-sm text-fg-subtle"
                  role="presentation"
                >
                  {emptyMessage}
                </li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={`${listboxId}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onPointerMove={() => {
                        if (!option.disabled && activeIndex !== index)
                          setActiveIndex(index);
                      }}
                      onClick={() => choose(option)}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive && "bg-surface-2",
                        isSelected ? "font-semibold text-brand" : "text-fg",
                        option.disabled && "cursor-not-allowed opacity-45",
                      )}
                    >
                      {option.icon ? (
                        <span className="mt-0.5 shrink-0 text-fg-muted [&_svg]:size-4">
                          {option.icon}
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate">{option.label}</span>
                          {option.meta ? (
                            <span className="num shrink-0 text-xs font-normal text-fg-subtle">
                              {option.meta}
                            </span>
                          ) : null}
                        </span>
                        {option.description ? (
                          <span className="mt-0.5 block text-xs font-normal text-fg-muted">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden="true"
                      />
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          host,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "group flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface text-left text-fg shadow-card transition-[border-color,box-shadow] hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50",
          "aria-expanded:border-brand-line aria-expanded:ring-4 aria-expanded:ring-brand-soft",
          size === "md" ? "h-11 px-3.5 text-sm" : "h-9 px-3 text-sm",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon ? (
            <span className="shrink-0 text-fg-muted [&_svg]:size-4">
              {selected.icon}
            </span>
          ) : null}
          <span className={cn("truncate", !selected && "text-fg-subtle")}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-fg-subtle"
          aria-hidden="true"
        />
      </button>
      {menu}
    </>
  );
}
