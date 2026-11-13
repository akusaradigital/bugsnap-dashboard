"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/lib/iconify";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  variant?: "field" | "field-white" | "pill" | "pill-white" | "inline" | "toolbar";
  placeholder?: string;
  className?: string;
  direction?: "down" | "up";
  disabled?: boolean;
  align?: "left" | "right";
}

const TRIGGER_BASE = "flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-all duration-150";
const TRIGGER_VARIANT: Record<NonNullable<DropdownProps["variant"]>, string> = {
  field: "w-full rounded-lg border border-border px-3 py-2 text-sm bg-subtle text-foreground justify-between hover:border-accent/40 hover:bg-subtle/80",
  "field-white": "w-full rounded-lg border border-border px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-foreground justify-between hover:border-accent/40 hover:bg-border/30",
  pill: "border border-border bg-subtle rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-foreground hover:border-accent/40 hover:bg-subtle/80",
  "pill-white": "border border-border bg-white dark:bg-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-foreground hover:border-accent/40 hover:bg-border/30",
  // For a select nested inside an already-styled wrapper pill (e.g. "Tag:" label + this trigger).
  inline: "bg-transparent font-medium text-foreground hover:text-accent",
  toolbar: "min-h-[38px] px-3 rounded-xl border border-border bg-background hover:bg-subtle text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer justify-between",
};

// Matches the folder "..." menu look (layout.tsx) - the house style for every custom dropdown panel.
export function Dropdown({ value, options, onChange, variant = "field", placeholder, className, direction = "down", disabled, align = "left" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [computedDirection, setComputedDirection] = useState<"down" | "up">(direction);
  const [computedAlign, setComputedAlign] = useState<"left" | "right">(align);
  const [panelStyle, setPanelStyle] = useState<{ maxWidth?: number; maxHeight?: number }>({});
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  // Smart positioning: auto-flip vertically if clipped by bottom, auto-align horizontally if clipped by right edge,
  // and dynamically clamp maxWidth and maxHeight to guarantee 0 overflow across mobile (320px-440px), tablet, and desktop.
  useEffect(() => {
    if (!open) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      let nextDir: "down" | "up" = "down";
      let nextMaxHeight = 240;
      if (direction === "up") {
        nextDir = "up";
        nextMaxHeight = Math.min(240, Math.max(120, rect.top - 12));
      } else {
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 220 && spaceAbove > spaceBelow) {
          nextDir = "up";
          nextMaxHeight = Math.min(240, Math.max(120, spaceAbove - 12));
        } else {
          nextDir = "down";
          nextMaxHeight = Math.min(240, Math.max(120, spaceBelow - 12));
        }
      }
      setComputedDirection(nextDir);

      let nextAlign: "left" | "right" = "left";
      let nextMaxWidth = 256;
      if (align === "right") {
        nextAlign = "right";
        nextMaxWidth = Math.min(256, Math.max(140, rect.right - 12));
      } else {
        const spaceRight = viewportWidth - rect.left;
        if (spaceRight < 240 && rect.right >= 180) {
          nextAlign = "right";
          nextMaxWidth = Math.min(256, Math.max(140, rect.right - 12));
        } else {
          nextAlign = "left";
          nextMaxWidth = Math.min(256, Math.max(140, spaceRight - 12));
        }
      }
      setComputedAlign(nextAlign);
      setPanelStyle({ maxWidth: nextMaxWidth, maxHeight: nextMaxHeight });
    }
  }, [open, direction, align]);

  // Touchscreen & pointer dismissal: pointerdown reacts immediately without 300ms touch delay
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        onChange(options[highlightedIndex].value);
        setOpen(false);
        triggerRef.current?.focus();
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const selected = options.find((o) => o.value === value);
  const isUp = computedDirection === "up";
  const shownLabel = selected?.label ?? placeholder ?? value;
  // Width follows the longest label (see the stacked grid below). "field" is a
  // full-width form input, and any className that sets w-full or flex-1 owns its width.
  const fitsContent = variant !== "field" && !/(^|\s)(w-full|flex-1)(\s|$)/.test(className ?? "");

  return (
    <div ref={ref} onKeyDown={handleKeyDown} className={`relative min-w-0 ${fitsContent ? "w-fit max-w-full" : ""} ${className || ""}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={`${TRIGGER_BASE} ${TRIGGER_VARIANT[variant]} ${fitsContent ? "w-full" : ""} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        {/* Every label is laid out in the same grid cell; only the selected one is visible,
            so the trigger is exactly as wide as the longest label. */}
        <span className="grid min-w-0 text-left">
          {options.map((o) => (
            <span
              key={o.value}
              className={`col-start-1 row-start-1 truncate ${o.value === value ? "" : "invisible"}`}
            >
              {o.label}
            </span>
          ))}
          {!selected && <span className="col-start-1 row-start-1 truncate">{shownLabel}</span>}
        </span>
        <Icon
          icon="lucide:chevron-down"
          className={`w-3.5 h-3.5 shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          style={panelStyle}
          className={`absolute ${computedAlign === "right" ? "right-0" : "left-0"} min-w-full w-max max-w-[min(16rem,calc(100vw-1.5rem))] max-h-60 overflow-y-auto border border-border bg-subtle py-1 shadow-xl overflow-x-hidden [overscroll-behavior:contain] ${
            isUp || variant === "toolbar" || variant === "pill"
              ? "rounded-xl text-xs"
              : "rounded-lg text-sm"
          } ${
            isUp ? "bottom-full mb-1.5 z-50" : "top-full mt-1.5 z-50"
          }`}
        >
          {options.map((o, idx) => {
            const isSelected = o.value === value;
            const isHighlighted = idx === highlightedIndex;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between gap-2 w-full px-3 text-left transition-colors ${
                  variant === "toolbar" || variant === "pill" ? "py-2 text-xs" : "py-2 text-sm"
                } ${
                  isHighlighted
                    ? "bg-border/40 text-foreground"
                    : isSelected
                    ? "font-semibold text-foreground bg-accent/10"
                    : "text-muted hover:bg-border/30 hover:text-foreground"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && (
                  <Icon icon="lucide:check" className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
