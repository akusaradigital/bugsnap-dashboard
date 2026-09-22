"use client";

import React, { useState } from "react";
import { IconPencil, IconPlayerPlay } from "./TablerIcons";

export function HeroProductShowcase() {
  const [activeTab, setActiveTab] = useState<"console" | "network" | "annotation" | "storage">("console");

  return (
    <div className="w-full rounded-xl border border-site-border bg-site-surface text-site-text font-site shadow-lg overflow-hidden">
      {/* Top Bar: Target App Simulation */}
      <div className="border-b border-site-border-subtle bg-site-surface-2 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            REC 00:14
          </span>
          <span className="text-site-text-2">Recording Tab:</span>
          <span className="font-mono text-site-text font-medium truncate max-w-[200px] sm:max-w-xs">
            checkout.acme.corp/pay
          </span>
        </div>

        {/* BugSnap Extension Controls Overlay */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-site-surface border border-site-border px-2 py-1 rounded-lg shadow-2xs text-xs">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-site-text hover:bg-site-surface-2 transition-colors font-medium text-[11px]"
            title="Annotation Tools"
          >
            <IconPencil size={13} className="text-accent" />
            <span>Annotate</span>
          </button>
          <span className="h-3 w-px bg-site-border" />
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors font-semibold text-[11px]"
          >
            <span className="h-2 w-2 rounded-xs bg-red-500" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Main Canvas: Simulated Bug UI with Selected Element */}
      <div className="relative p-4 sm:p-6 bg-site-surface border-b border-site-border">
        {/* Mock Application Content */}
        <div className="max-w-xl mx-auto space-y-4 py-2">
          <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle">
            <div>
              <div className="text-sm font-semibold text-site-text">Order #48291</div>
              <div className="text-xs text-site-text-2">Enterprise Plan (Annual billing)</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-site-text">$2,400.00</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Ready to charge</div>
            </div>
          </div>

          {/* Form Fields with Element Selection Highlight */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-site-text-2 mb-1">Payment Method</label>
              <div className="rounded-lg border border-site-border bg-site-surface-2 px-3 py-2 text-xs font-mono text-site-text flex items-center justify-between">
                <span>•••• •••• •••• 4242</span>
                <span className="text-[10px] text-site-text-2">12/28</span>
              </div>
            </div>

            {/* Targeted Bug Element */}
            <div className="relative">
              <div className="rounded-lg border-2 border-red-500 bg-red-500/5 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Pay $2,400.00
                  </span>
                </div>
                <span className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                  HTTP 500 on click
                </span>
              </div>

              {/* BugSnap On-Screen Callout */}
              <div className="absolute -top-3.5 right-2 bg-site-text text-site-surface text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 pointer-events-none">
                <svg className="w-2.5 h-2.5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>Captured error state</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DevTools Telemetry Inspector Section */}
      <div className="bg-site-surface-2">
        {/* Panel Tabs */}
        <div className="flex items-center gap-1 px-3 border-b border-site-border bg-site-surface text-xs overflow-x-auto">
          <span className="text-[11px] font-semibold text-site-text-2 uppercase tracking-wider px-2 py-2 shrink-0">
            DevTools Context:
          </span>
          <button
            type="button"
            onClick={() => setActiveTab("console")}
            className={`px-3 py-2 font-medium border-b-2 transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === "console"
                ? "border-accent text-site-text font-semibold"
                : "border-transparent text-site-text-2 hover:text-site-text"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span>Console (1)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("network")}
            className={`px-3 py-2 font-medium border-b-2 transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === "network"
                ? "border-accent text-site-text font-semibold"
                : "border-transparent text-site-text-2 hover:text-site-text"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Network (1 failed)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("annotation")}
            className={`px-3 py-2 font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === "annotation"
                ? "border-accent text-site-text font-semibold"
                : "border-transparent text-site-text-2 hover:text-site-text"
            }`}
          >
            Annotation Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`px-3 py-2 font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === "storage"
                ? "border-accent text-site-text font-semibold"
                : "border-transparent text-site-text-2 hover:text-site-text"
            }`}
          >
            System Specs
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="p-3.5 font-mono text-xs overflow-x-auto min-h-[120px]">
          {activeTab === "console" && (
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-500/5 p-2 rounded border border-red-500/20">
                <span className="text-[10px] font-bold text-red-500 shrink-0">✕</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[11px] leading-tight break-all">
                    Uncaught TypeError: Cannot read properties of undefined (reading &apos;checkoutSessionId&apos;)
                  </div>
                  <div className="text-[10px] text-site-text-2 mt-0.5">
                    at submitPayment (checkout.ts:148:19) • at HTMLButtonElement.dispatch (main.js:4:8120)
                  </div>
                </div>
                <span className="text-[10px] text-site-text-2 shrink-0">14:22:04</span>
              </div>
              <div className="flex items-center gap-2 text-site-text-2 text-[11px] px-2">
                <span className="text-amber-500 text-[10px]">⚠</span>
                <span className="truncate">[Warning] Form submission attempted before stripe.js initialized</span>
              </div>
            </div>
          )}

          {activeTab === "network" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs bg-red-500/5 p-2 rounded border border-red-500/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[10px]">
                    500
                  </span>
                  <span className="font-bold text-site-text">POST</span>
                  <span className="text-site-text truncate">/api/v1/checkout/charge</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] text-site-text-2">
                  <span>248ms</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">Internal Server Error</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs px-2 py-1 text-site-text-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                    200
                  </span>
                  <span className="font-medium text-site-text">GET</span>
                  <span className="truncate">/api/v1/users/me</span>
                </div>
                <span className="text-[11px]">42ms</span>
              </div>
            </div>
          )}

          {activeTab === "annotation" && (
            <div className="space-y-1 text-xs text-site-text">
              <div className="flex items-center gap-2 p-1.5 rounded hover:bg-site-surface">
                <span className="text-accent text-[11px]">↳</span>
                <span className="font-semibold text-site-text">00:08</span>
                <span className="text-site-text-2">Box added on button#btn-pay</span>
                <span className="text-[10px] text-accent font-medium ml-auto">Visual Highlight</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded hover:bg-site-surface">
                <span className="text-accent text-[11px]">↳</span>
                <span className="font-semibold text-site-text">00:12</span>
                <span className="text-site-text-2">User click recorded on disabled element</span>
                <span className="text-[10px] text-site-text-2 ml-auto">Click Ripple</span>
              </div>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-site-surface border border-site-border-subtle">
                <div className="text-site-text-2 text-[10px] uppercase">Operating System</div>
                <div className="font-semibold text-site-text mt-0.5">macOS Sequoia (ARM64)</div>
              </div>
              <div className="p-2 rounded bg-site-surface border border-site-border-subtle">
                <div className="text-site-text-2 text-[10px] uppercase">Browser Engine</div>
                <div className="font-semibold text-site-text mt-0.5">Chrome 129.0</div>
              </div>
              <div className="p-2 rounded bg-site-surface border border-site-border-subtle">
                <div className="text-site-text-2 text-[10px] uppercase">Viewport Resolution</div>
                <div className="font-semibold text-site-text mt-0.5">1920 × 1080 (DPR 2.0)</div>
              </div>
              <div className="p-2 rounded bg-site-surface border border-site-border-subtle">
                <div className="text-site-text-2 text-[10px] uppercase">Storage Location</div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Google Drive (Private)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DevToolsCard() {
  return (
    <div className="rounded-xl border border-site-border bg-site-surface p-4 font-mono text-xs shadow-xs text-site-text">
      <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="font-semibold font-sans text-xs">Console & Network Diagnostics</span>
        </div>
        <span className="text-[10px] text-site-text-2">Auto-Captured</span>
      </div>
      <div className="mt-3 space-y-2 text-[11px]">
        <div className="text-red-600 dark:text-red-400 bg-red-500/5 p-2 rounded border border-red-500/20">
          <div className="font-bold">HTTP 502 Bad Gateway</div>
          <div className="text-site-text-2 text-[10px] mt-0.5">GET /api/v2/workspace/metrics • 812ms</div>
        </div>
        <div className="text-site-text bg-site-surface-2 p-2 rounded">
          <span className="text-accent font-bold">Trace: </span>
          <span>WorkspaceLayout.tsx:84 &gt; useMetrics.ts:31</span>
        </div>
      </div>
    </div>
  );
}

export function GoogleDriveProofCard() {
  return (
    <div className="rounded-xl border border-site-border bg-site-surface p-4 text-xs font-site shadow-xs text-site-text">
      <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/google.svg" alt="" aria-hidden="true" className="w-4 h-4" />
          <span className="font-semibold">My Drive / BugSnap</span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
          100% Owned by You
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between p-2 rounded bg-site-surface-2 text-[11px]">
          <div className="flex items-center gap-2 truncate">
            <IconPlayerPlay size={10} className="text-accent fill-current shrink-0" />
            <span className="font-mono text-site-text truncate">bug-checkout-error-2026-09.webm</span>
          </div>
          <span className="text-site-text-2 shrink-0 text-[10px]">12.4 MB</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-site-surface-2 text-[11px]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-site-text-2 font-bold">{ }</span>
            <span className="font-mono text-site-text truncate">devtools-telemetry.json</span>
          </div>
          <span className="text-site-text-2 shrink-0 text-[10px]">48 KB</span>
        </div>
      </div>
    </div>
  );
}

export function ExportTicketCard() {
  return (
    <div className="rounded-xl border border-site-border bg-site-surface p-4 text-xs font-site shadow-xs text-site-text">
      <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold">Formatted Bug Report</span>
        </div>
        <span className="text-[10px] font-mono text-site-text-2">Linear / Jira format</span>
      </div>
      <div className="mt-3 space-y-1.5 font-mono text-[11px] bg-site-surface-2 p-3 rounded text-site-text">
        <div className="text-accent font-bold">## Summary</div>
        <div className="text-site-text-2">Checkout button throws TypeError on click</div>
        <div className="text-accent font-bold mt-2">## Environment</div>
        <div className="text-site-text-2">Chrome 129 / macOS / 1920x1080</div>
        <div className="text-accent font-bold mt-2">## Telemetry Attached</div>
        <div className="text-site-text-2">1 console error • 1 HTTP 500 error</div>
      </div>
    </div>
  );
}
