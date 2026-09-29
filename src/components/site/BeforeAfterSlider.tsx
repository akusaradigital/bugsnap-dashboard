"use client";

export function BeforeAfterSlider() {
  return (
    <div className="w-full">
      {/* Two-column on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row items-stretch gap-0 md:gap-0">
        {/* LEFT: Before BugSnap */}
        <div className="flex-1 rounded-2xl border border-site-border bg-site-surface-2 p-6 opacity-90">
          <h3 className="text-base font-semibold text-site-text-2 mb-4">
            😩 The Old Way
          </h3>

          {/* Slack thread mock */}
          <div className="space-y-3">
            {/* Message 1 — Sarah */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">Sarah [QA]</span>
                  <span className="text-[10px] text-muted">9:14 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  hey the payment button is broken again, checkout page, screenshot attached 📷
                </div>
              </div>
            </div>

            {/* Message 2 — Alex */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">Alex [Dev]</span>
                  <span className="text-[10px] text-muted">9:22 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  which browser? and do you have console errors?
                </div>
              </div>
            </div>

            {/* Message 3 — Sarah */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">Sarah [QA]</span>
                  <span className="text-[10px] text-muted">9:31 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  chrome, not sure how to get console errors... can you look?
                </div>
              </div>
            </div>

            {/* Message 4 — Alex */}
            <div className="flex items-start gap-2">
              <div className="flex-none w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-site-text">Alex [Dev]</span>
                  <span className="text-[10px] text-muted">9:45 AM</span>
                </div>
                <div className="bg-site-surface border border-site-border-subtle rounded-lg rounded-tl-none px-3 py-2 text-xs text-site-text">
                  i need the exact error, network tab, what steps reproduce this, OS, and screen resolution
                </div>
              </div>
            </div>

            {/* Ellipsis */}
            <p className="text-center text-site-text-2 text-xs tracking-widest opacity-50 select-none">
              • • •
            </p>
          </div>

          {/* Red pill badge */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
              ⏱ 47 min back-and-forth · still no repro
            </span>
          </div>
        </div>

        {/* VS divider */}
        <div className="flex md:flex-col items-center justify-center py-4 md:py-0 md:px-4">
          <div className="w-9 h-9 rounded-full bg-site-surface border-2 border-site-border flex items-center justify-center text-xs font-bold text-site-text-2 shadow-sm flex-none">
            VS
          </div>
        </div>

        {/* RIGHT: With BugSnap */}
        <div className="flex-1 relative rounded-2xl border border-site-border bg-site-surface overflow-hidden p-6">
          {/* Left accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" aria-hidden="true" />

          <h3 className="text-base font-semibold text-accent mb-4">
            ✨ With BugSnap
          </h3>

          {/* BugSnap report card */}
          <div className="rounded-xl border border-site-border bg-site-surface-2 overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-site-border bg-site-surface">
              {/* Mini logo mark */}
              <div className="w-5 h-5 rounded bg-accent flex items-center justify-center flex-none">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="4" stroke="white" strokeWidth="1.5" />
                  <circle cx="6" cy="6" r="1.5" fill="white" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-site-text">Checkout Error Report</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-site-border-subtle">
              <ReportRow icon="🎥" text="Recording (14s) — auto-attached" />
              <ReportRow icon="🔴" text="Console: 2 errors captured automatically" />
              <ReportRow icon="🌐" text="Network: POST /api/payment → 500 (cURL ready)" />
              <ReportRow icon="💻" text="System: Chrome 124 · macOS · 1280×720" />
              <ReportRow
                icon="🔗"
                text="bugsnap.akusaraproject.my.id/v/8f921a"
                mono
              />
            </div>

            {/* Export button */}
            <div className="px-4 py-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 transition-colors"
              >
                Export to Linear →
              </button>
            </div>
          </div>

          {/* Green pill badge */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium">
              ⚡ 1 link sent · dev reproduced in 3 min
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
}: {
  icon: string;
  text: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <span className="text-sm flex-none">{icon}</span>
      <span
        className={`text-xs text-site-text truncate ${mono ? "font-mono text-accent" : ""}`}
      >
        {text}
      </span>
    </div>
  );
}
