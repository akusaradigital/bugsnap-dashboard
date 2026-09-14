"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  variant?: "field" | "pill" | "inline";
  placeholder?: string;
  className?: string;
}

const TRIGGER_BASE = "flex items-center gap-2 outline-none transition-all duration-150";
const TRIGGER_VARIANT: Record<NonNullable<DropdownProps["variant"]>, string> = {
  field: "w-full rounded-lg border border-border px-3 py-2 text-sm bg-subtle text-foreground justify-between hover:border-accent/40 hover:bg-subtle/80",
  pill: "border border-border bg-subtle rounded-lg px-2 py-1.5 text-xs text-muted hover:text-foreground hover:border-accent/40 hover:bg-subtle/80",
  // For a select nested inside an already-styled wrapper pill (e.g. "Tag:" label + this trigger).
  inline: "bg-transparent font-medium text-foreground hover:text-accent",
};

// Matches the folder "..." menu look (layout.tsx) - the house style for every custom dropdown panel.
export function Dropdown({ value, options, onChange, variant = "field", placeholder, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
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

  return (
    <div ref={ref} onKeyDown={handleKeyDown} className={`relative min-w-0 ${className || ""}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={`${TRIGGER_BASE} ${TRIGGER_VARIANT[variant]}`}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? value}</span>
        <svg className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute top-full left-0 mt-1.5 min-w-full w-max max-w-[min(16rem,calc(100vw-1.5rem))] z-30 rounded-lg border border-border bg-subtle py-1 text-sm shadow-lg overflow-hidden"
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
                className={`block w-full px-3 py-2 text-left transition-colors ${
                  isHighlighted ? "bg-border/40 text-foreground" : isSelected ? "font-medium text-foreground bg-border/20" : "text-muted hover:bg-border/30 hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
