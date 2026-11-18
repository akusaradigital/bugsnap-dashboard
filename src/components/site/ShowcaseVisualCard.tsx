"use client";

import { withAssetVersion } from "@/lib/iconify";

interface ShowcaseVisualCardProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectClassName?: string;
  className?: string;
}

export function ShowcaseVisualCard({
  src,
  alt,
  width = 1200,
  height = 750,
  aspectClassName = "aspect-[16/10]",
  className = "",
}: ShowcaseVisualCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden ${className}`}
    >
      <div className={`relative w-full ${aspectClassName} bg-slate-50 dark:bg-slate-950`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withAssetVersion(src)}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain block"
        />
      </div>
    </div>
  );
}
