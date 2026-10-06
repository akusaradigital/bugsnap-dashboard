"use client";

import { useState, useEffect, useCallback } from "react";

type ShortcutId = "screenshot" | "record" | "upload";

interface Shortcut {
  id: ShortcutId;
  keys: string[];
  label: string;
  description: string;
  flashMessage: string;
  colorClass: string;
  accentBorder: string;
  accentBg: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    id: "screenshot",
    keys: ["Ctrl", "Shift", "S"],
    label: "Instant Screenshot",
    description:
      "Captures the full viewport + auto-extracts console errors & network logs",
    flashMessage:
      "✅ Screenshot captured (1.2s) · 3 console errors extracted · 2 network failures",
    colorClass: "text-blue-500",
    accentBorder: "border-blue-400/50",
    accentBg: "bg-blue-500/5",
  },
  {
    id: "record",
    keys: ["Ctrl", "Shift", "F"],
    label: "Screen Recording",
    description:
      "Records video with audio + DevTools running silently in background",
    flashMessage: "🔴 Recording started - DevTools telemetry active",
    colorClass: "text-rose-500",
    accentBorder: "border-rose-400/50",
    accentBg: "bg-rose-500/5",
  },
  {
    id: "upload",
    keys: ["Ctrl", "Shift", "U"],
    label: "Upload Screenshot / Video",
    description:
      "Manually upload any screenshot or screen recording for annotation",
    flashMessage: "📁 Upload dialog opened",
    colorClass: "text-violet-500",
    accentBorder: "border-violet-400/50",
    accentBg: "bg-violet-500/5",
  },
];

const FLASH_DURATION_MS = 1200;

export function HotkeyCommandBar() {
  const [active, setActive] = useState<ShortcutId | null>(null);

  const trigger = useCallback((id: ShortcutId) => {
    setActive(id);
    setTimeout(() => setActive(null), FLASH_DURATION_MS);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      if (e.key === "S") {
        e.preventDefault();
        trigger("screenshot");
      } else if (e.key === "F") {
        e.preventDefault();
        trigger("record");
      } else if (e.key === "U") {
        e.preventDefault();
        trigger("upload");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [trigger]);

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-site-border bg-site-surface shadow-sm overflow-hidden">
      {/* macOS-style command bar */}
      <div className="px-4 py-3 border-b border-site-border bg-site-surface-2 flex items-center gap-3">
        {/* Traffic lights */}
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        {/* Search icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-site-text-2 shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          readOnly
          tabIndex={-1}
          className="flex-1 bg-transparent text-sm text-site-text-2 placeholder:text-muted outline-none cursor-default select-none"
          placeholder="Press a shortcut to see it in action…"
        />
        <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted bg-site-bg border border-site-border-subtle rounded px-1.5 py-0.5 shrink-0">
          esc
        </kbd>
      </div>

      {/* Shortcut rows */}
      <div className="flex flex-col gap-2 p-3">
        {SHORTCUTS.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => trigger(s.id)}
              className={[
                "flex items-start sm:items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-xl border text-left",
                "transition-all duration-200 cursor-pointer w-full",
                isActive
                  ? `${s.accentBorder} ${s.accentBg} border-accent/30 bg-accent/5`
                  : "border-site-border bg-site-surface",
              ].join(" ")}
              aria-label={`Trigger ${s.label} shortcut`}
            >
              {/* Key badges */}
              <div className="flex items-center gap-1 shrink-0 mt-0.5 sm:mt-0">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className={[
                      "inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg",
                      "border sm:border-2 border-site-border shadow-xs sm:shadow-sm font-mono text-[11px] sm:text-xs font-bold",
                      "bg-site-bg text-site-text transition-colors duration-200",
                      isActive ? s.colorClass : "",
                    ].join(" ")}
                  >
                    {key}
                  </kbd>
                ))}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold transition-colors duration-200 ${isActive ? s.colorClass : "text-site-text"}`}
                >
                  {s.label}
                </p>
                {isActive ? (
                  <p className="text-xs font-medium mt-0.5 text-site-text-2 animate-[fadeIn_0.15s_ease-out]">
                    {s.flashMessage}
                  </p>
                ) : (
                  <p className="text-xs text-muted mt-0.5">{s.description}</p>
                )}
              </div>

              {/* Live indicator dot */}
              {isActive && (
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0 ${
                    s.id === "record"
                      ? "bg-rose-500"
                      : s.id === "upload"
                        ? "bg-violet-500"
                        : "bg-blue-500"
                  } animate-pulse`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom tip */}
      <p className="text-xs text-site-text-2 text-center pb-4 px-4">
        💡 Try pressing the shortcuts on your keyboard right now
      </p>
    </div>
  );
}
