"use client";

import React from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

export interface ZeroDataDiagramProps {
  className?: string;
}

export function ZeroDataDiagram({ className = "" }: ZeroDataDiagramProps = {}) {
  const { t } = useT();

  return (
    <div className={`w-full max-w-4xl mx-auto font-site ${className}`}>
      {/* Embedded CSS animations for flowing data lines */}
      <style>{`
        @keyframes zeroDataDashH {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -20; }
        }
        @keyframes zeroDataDashV {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -18; }
        }
        .animate-flow-dash-h {
          animation: zeroDataDashH 1.2s linear infinite;
        }
        .animate-flow-dash-v {
          animation: zeroDataDashV 1.2s linear infinite;
        }
      `}</style>

      {/* Main Diagram Card Container */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 shadow-sm">
        {/* DESKTOP LAYOUT (>= md) */}
        <div className="hidden md:block">
          <div className="flex items-stretch justify-between gap-3 lg:gap-4 relative">
            {/* NODE 1 - Your Browser */}
            <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 text-center flex flex-col items-center justify-between min-h-[190px] shadow-2xs min-w-0">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100/80 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  REC
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {t("site.trust.browserBadge")}
                </span>
              </div>

              {/* Browser Illustration */}
              <div className="my-auto py-2">
                <div className="w-14 h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs flex flex-col overflow-hidden mx-auto">
                  <div className="h-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-1.5 gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  </div>
                  <div className="p-1.5 flex flex-col gap-1">
                    <div className="w-6 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="w-9 h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                  {t("site.trust.browserTitle")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {t("site.trust.browserDesc")}
                </p>
              </div>
            </div>

            {/* CONNECTOR 1 -> 2 (Direct Upload via OAuth) */}
            <div className="w-28 lg:w-36 flex-shrink-0 flex flex-col items-center justify-center px-1">
              <div className="px-2.5 py-1 rounded-full bg-[#EBF7E3] dark:bg-emerald-950/60 border border-[#CFE6BF] dark:border-emerald-800/60 text-[#3D7A24] dark:text-emerald-400 font-bold text-[10px] whitespace-nowrap mb-1.5 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D7A24] dark:bg-emerald-400 animate-ping" />
                <span>{t("site.trust.flow1Badge")}</span>
              </div>
              <svg
                width="100%"
                height="22"
                viewBox="0 0 110 22"
                fill="none"
                className="overflow-visible"
                aria-hidden="true"
              >
                {/* Background track */}
                <line
                  x1="0"
                  y1="11"
                  x2="100"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-200 dark:text-slate-800"
                />
                {/* Animated green dashed line */}
                <line
                  x1="0"
                  y1="11"
                  x2="100"
                  y2="11"
                  stroke="#3D7A24"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-flow-dash-h"
                />
                {/* Arrowhead */}
                <polygon points="98,6 108,11 98,16" fill="#3D7A24" />
                {/* Moving dot */}
                <circle cy="11" r="3.5" fill="#3D7A24">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="100"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              <span className="text-[10px] text-[#3D7A24] dark:text-[#72C048] font-mono font-semibold tracking-tight mt-1 text-center">
                {t("site.trust.flow1Sub")}
              </span>
            </div>

            {/* NODE 2 - Your Google Drive (Hero Node) */}
            <div className="flex-1 rounded-2xl border-2 border-[#DC2626] dark:border-emerald-700 bg-[#F4FBF0] dark:bg-emerald-950/25 p-5 text-center flex flex-col items-center justify-between min-h-[190px] shadow-sm relative overflow-hidden min-w-0">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF7E3] dark:bg-emerald-900/40 text-[#3D7A24] dark:text-emerald-300 border border-[#CFE6BF] dark:border-emerald-800/60 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D7A24] dark:bg-emerald-400" />
                  100% PRIVATE
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#3D7A24] dark:text-emerald-400 uppercase">
                  {t("site.trust.driveBadge")}
                </span>
              </div>

              {/* Google Drive Logo */}
              <div className="my-auto py-2">
                <Icon icon="logos:google-drive" className="w-12 h-12 mx-auto drop-shadow-xs" aria-hidden="true" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                  {t("site.trust.driveTitle")}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                  {t("site.trust.driveDesc")}
                </p>
              </div>
            </div>

            {/* ZERO CONNECTION DIVIDER */}
            <div className="w-16 lg:w-20 flex-shrink-0 flex flex-col items-center justify-center text-center px-1">
              <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1">
                <Icon icon="lucide:ban" className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                NO FILES
              </span>
            </div>

            {/* NODE 3 - BugSnap Cloud */}
            <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 text-center flex flex-col items-center justify-between min-h-[190px] shadow-2xs opacity-80 min-w-0">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                  0 BYTES
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {t("site.trust.serverBadge")}
                </span>
              </div>

              {/* Cloud / Database Server Icon */}
              <div className="my-auto py-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto">
                  <Icon icon="lucide:server" className="w-6 h-6" aria-hidden="true" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                  {t("site.trust.serverTitle")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {t("site.trust.serverDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* SECONDARY FLOW: Browser -> BugSnap Cloud (Curved Underneath) */}
          <div className="relative mt-3 h-14">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 50"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M 90 0 v 18 q 0 16 16 16 h 388 q 16 0 16 -16 v -12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="text-slate-300 dark:text-slate-700"
              />
              <polygon
                points="506,8 510,0 514,8"
                fill="currentColor"
                className="text-slate-400 dark:text-slate-600"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
              <span className="px-3 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium shadow-2xs">
                {t("site.trust.flow2Badge")}:{" "}
                <span className="text-slate-400 dark:text-slate-500">
                  {t("site.trust.flow2Sub")}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE LAYOUT (< md) */}
        <div className="md:hidden flex flex-col items-stretch space-y-3">
          {/* NODE 1 - Browser */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-2 font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>{t("site.trust.browserBadge")}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">
              {t("site.trust.browserTitle")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t("site.trust.browserDesc")}
            </p>
          </div>

          {/* ARROW 1 -> 2 (Vertical Direct OAuth) */}
          <div className="flex flex-col items-center py-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7E3] dark:bg-emerald-950/60 border border-[#CFE6BF] dark:border-emerald-800/60 text-[#3D7A24] dark:text-emerald-400 font-bold text-[11px] mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D7A24] dark:bg-emerald-400 animate-ping" />
              <span>{t("site.trust.flow1Badge")}</span>
            </div>
            <svg width="20" height="34" viewBox="0 0 20 34" fill="none" aria-hidden="true">
              <line
                x1="10"
                y1="0"
                x2="10"
                y2="26"
                stroke="#3D7A24"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                className="animate-flow-dash-v"
              />
              <polygon points="6,24 10,32 14,24" fill="#3D7A24" />
            </svg>
            <span className="text-[10px] text-[#3D7A24] dark:text-[#72C048] font-mono font-semibold mt-0.5">
              {t("site.trust.flow1Sub")}
            </span>
          </div>

          {/* NODE 2 - Google Drive */}
          <div className="rounded-2xl border-2 border-[#DC2626] dark:border-emerald-700 bg-[#F4FBF0] dark:bg-emerald-950/25 p-5 text-center relative">
            <div className="flex items-center justify-center mb-2">
              <Icon icon="logos:google-drive" className="w-10 h-10" aria-hidden="true" />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF7E3] dark:bg-emerald-900/40 text-[#3D7A24] dark:text-emerald-300 text-[10px] font-mono font-bold mb-2">
              <span>{t("site.trust.driveBadge")}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">
              {t("site.trust.driveTitle")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {t("site.trust.driveDesc")}
            </p>
          </div>

          {/* ARROW 1 -> 3 (Vertical Metadata Only) */}
          <div className="flex flex-col items-center py-1">
            <div className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-medium mb-1">
              {t("site.trust.flow2Badge")}
            </div>
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none" aria-hidden="true">
              <line
                x1="10"
                y1="0"
                x2="10"
                y2="20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="text-slate-300 dark:text-slate-700"
              />
              <polygon points="6,18 10,26 14,18" fill="currentColor" className="text-slate-400 dark:text-slate-600" />
            </svg>
          </div>

          {/* NODE 3 - BugSnap Cloud */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 text-center opacity-80">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold mb-1">
              {t("site.trust.serverBadge")}
            </div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">
              {t("site.trust.serverTitle")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t("site.trust.serverDesc")}
            </p>
          </div>
        </div>

        {/* BOTTOM TRUST CHECKMARKS */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#EBF7E3] dark:bg-emerald-950/60 text-[#3D7A24] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-snug">
              {t("site.trust.pill1")}
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#EBF7E3] dark:bg-emerald-950/60 text-[#3D7A24] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-snug">
              {t("site.trust.pill2")}
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#EBF7E3] dark:bg-emerald-950/60 text-[#3D7A24] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-snug">
              {t("site.trust.pill3")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
