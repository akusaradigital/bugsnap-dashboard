import React, { ReactNode } from "react";

interface BrowserFrameProps {
  url?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function BrowserFrame({
  url = "https://app.example.com/checkout",
  badge,
  children,
  className = "",
  headerRight,
}: BrowserFrameProps) {
  return (
    <div
      className={`rounded-xl border border-site-border bg-site-surface shadow-md overflow-hidden text-site-text font-site ${className}`}
    >
      {/* Browser Chrome Header */}
      <div className="flex items-center justify-between gap-3 border-b border-site-border-subtle bg-site-surface-2 px-3.5 py-2.5">
        {/* Window controls */}
        <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-md mx-auto flex items-center justify-center gap-2 rounded-md border border-site-border-subtle bg-site-surface px-3 py-1 text-xs text-site-text-2">
          <svg
            className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="truncate font-mono text-[11px] select-all">{url}</span>
          {badge && (
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>

        {/* Optional Right Action */}
        <div className="shrink-0 flex items-center gap-2 text-xs">
          {headerRight}
        </div>
      </div>

      {/* Frame Body */}
      <div className="relative bg-site-surface">{children}</div>
    </div>
  );
}
