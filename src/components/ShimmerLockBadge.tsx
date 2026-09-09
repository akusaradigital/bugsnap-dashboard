"use client";

import React from "react";

interface ShimmerLockBadgeProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Shimmer Lock Badge for Pro-gated features.
 * Attracts attention to high-value features and triggers upgrade prompt.
 */
export function ShimmerLockBadge({
  label = "PRO",
  onClick,
  className = "",
}: ShimmerLockBadgeProps) {
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider overflow-hidden border border-amber-300/80 dark:border-amber-600/60 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 dark:from-amber-950/70 dark:via-amber-900/40 dark:to-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs transition-all hover:scale-105 active:scale-95 group ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      title="Pro feature — Click to upgrade"
    >
      {/* Subtle shimmer bar */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
      <span>{label}</span>
    </Tag>
  );
}
