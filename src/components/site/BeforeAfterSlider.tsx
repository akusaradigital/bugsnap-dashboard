"use client";

import { Icon } from "@/lib/iconify";

export function BeforeAfterSlider() {
  return (
    <div className="w-full">
      {/* Two-column on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row items-stretch gap-0 md:gap-0">
        {/* LEFT: Before BugSnap */}
        <div className="flex-1 rounded-2xl border border-site-border bg-site-surface-2 p-4 sm:p-6 opacity-90 min-w-0">
          <h3 className="text-base font-semibold text-site-text-2 mb-4 flex items-center gap-2">
            <Icon icon="lucide:clock-9" className="w-4 h-4 shrink-0 text-slate-400" />
            <span>The Old Way</span>
          </h3>

          {/* Slack thread mock */}
          <div className="space-y-3">
            {/* Message 1 - Joe */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                J
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">
                    Joe [QA]
                  </span>
                  <span className="text-[10px] text-muted">9:14 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  hey the payment button is broken again, checkout page,
                  screenshot attached <Icon icon="lucide:camera" className="inline w-3 h-3 text-slate-400 align-baseline ml-0.5" />
                </div>
              </div>
            </div>

            {/* Message 2 - Steve */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">
                    Steve [Dev]
                  </span>
                  <span className="text-[10px] text-muted">9:22 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  which browser? and do you have console errors?
                </div>
              </div>
            </div>

            {/* Message 3 - Joe */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                J
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">
                    Joe [QA]
                  </span>
                  <span className="text-[10px] text-muted">9:31 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  chrome, not sure how to get console errors... can you look?
                </div>
              </div>
            </div>

            {/* Message 4 - Steve */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">
                    Steve [Dev]
                  </span>
                  <span className="text-[10px] text-muted">9:45 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  i need the exact error, network tab, what steps reproduce
                  this, OS, and screen resolution
                </div>
              </div>
            </div>

            {/* Ellipsis */}
            <p className="text-center text-site-text-2 text-xs tracking-widest opacity-50 select-none">
              • • •
            </p>
          </div>

          {/* Red status badge */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] sm:text-xs font-medium">
              ⏱ 47 min back-and-forth · still no repro
            </span>
          </div>
        </div>

        {/* VS divider */}
        <div className="flex md:flex-col items-center justify-center py-4 md:py-0 md:px-4">
          <div className="w-8 h-8 rounded-lg bg-site-surface border border-site-border flex items-center justify-center text-xs font-bold text-site-text-2 shadow-2xs flex-none">
            VS
          </div>
        </div>

        {/* RIGHT: With BugSnap */}
        <div className="flex-1 relative rounded-2xl border border-site-border bg-site-surface overflow-hidden p-4 sm:p-6 min-w-0">
          {/* Left accent stripe */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent"
            aria-hidden="true"
          />

          <h3 className="text-base font-semibold text-accent mb-4 flex items-center gap-1.5">
            <Icon icon="lucide:sparkles" className="w-4 h-4 shrink-0 text-accent" />
            <span>With BugSnap</span>
          </h3>

          {/* BugSnap report card */}
          <div className="rounded-xl border border-site-border bg-site-surface-2 overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-site-border bg-site-surface">
              {/* Mini logo mark */}
              <div className="w-5 h-5 rounded bg-accent flex items-center justify-center flex-none">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="4"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <circle cx="6" cy="6" r="1.5" fill="white" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-site-text">
                Checkout Error Report
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-site-border-subtle">
              <ReportRow icon="lucide:video" text="Recording (14s) - auto-attached" iconColor="text-emerald-500" />
              <ReportRow
                icon="lucide:alert-circle"
                text="Console: 2 errors captured automatically"
                iconColor="text-rose-500"
              />
              <ReportRow
                icon="lucide:globe"
                text="Network: POST /api/payment → 500 (cURL ready)"
                iconColor="text-sky-500"
              />
              <ReportRow
                icon="lucide:monitor"
                text="System: Chrome 124 · macOS · 1280×720"
                iconColor="text-slate-500"
              />
              <ReportRow
                icon="lucide:link"
                text="bugsnap.akusaraproject.my.id/v/8f921a"
                mono
                iconColor="text-[#6B9A35] dark:text-[#A8D666]"
              />
            </div>

            {/* Export button */}
            <div className="px-4 py-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 transition-colors cursor-pointer"
              >
                <span>Export to Linear</span>
                <Icon icon="lucide:arrow-right" className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Green status badge */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[11px] sm:text-xs font-medium">
              <Icon icon="lucide:zap" className="w-3.5 h-3.5 shrink-0 text-green-500" />
              <span>1 link sent · dev reproduced in 3 min</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportRow({
  icon,
  text,
  mono = false,
  iconColor,
}: {
  icon: string;
  text: string;
  mono?: boolean;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 min-w-0">
      <Icon icon={icon} className={`w-4 h-4 shrink-0 ${iconColor || "text-site-text"}`} />
      <span
        className={`text-xs text-site-text truncate min-w-0 ${mono ? "font-mono text-accent" : ""}`}
      >
        {text}
      </span>
    </div>
  );
}
