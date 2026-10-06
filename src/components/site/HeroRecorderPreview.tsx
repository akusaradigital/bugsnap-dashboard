"use client";

import { useState } from "react";
import { IconCheck, IconPencil } from "./TablerIcons";

export function HeroRecorderPreview() {
  const [activeTab, setActiveTab] = useState<"console" | "network">("console");

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Soft rounded mint container */}
      <div
        className="relative rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 pb-4 overflow-hidden border border-site-border shadow-2xl"
        style={{ background: "linear-gradient(160deg, #eaf9f4 0%, #f4faf7 100%)" }}
      >
        {/* Dark mode overlay */}
        <div
          className="absolute inset-0 dark:block hidden"
          style={{ background: "linear-gradient(160deg, rgba(20,85,75,0.25) 0%, rgba(7,20,16,0.85) 100%)" }}
          aria-hidden="true"
        />

        {/* Floating live capture window */}
        <div className="relative rounded-xl border border-site-border bg-site-surface text-site-text shadow-xl overflow-hidden font-site">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-site-border bg-site-surface-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-[11px] font-mono text-site-text-2 bg-site-surface px-2.5 py-0.5 rounded border border-site-border flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">app.acme.corp/checkout</span>
              </span>
            </div>

            {/* Live REC indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-mono font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>REC 00:14</span>
            </div>
          </div>

          {/* Captured Target App Viewport */}
          <div className="p-4 sm:p-5 bg-site-surface border-b border-site-border space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-site-border">
              <span className="text-site-text-2 font-medium">Checkout Flow</span>
              <span className="font-mono font-bold text-site-text">$2,400.00</span>
            </div>

            {/* Highlighted Bug Area with BugSnap Callout */}
            <div className="relative">
              <div className="rounded-lg border-2 border-red-500 bg-red-500/5 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Pay $2,400.00
                  </span>
                </div>
                <span className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  HTTP 500 Error
                </span>
              </div>

              {/* BugSnap Annotation Callout Badge */}
              <div className="absolute -top-3 right-3 bg-site-text text-site-surface text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <IconPencil size={10} className="text-accent" />
                <span>Captured error state</span>
              </div>
            </div>
          </div>

          {/* Bottom DevTools Drawer */}
          <div className="bg-site-surface-2 text-xs">
            {/* DevTools Drawer Header */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1 border-b border-site-border bg-site-surface text-[11px]">
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab("console")}
                  className={`px-2.5 py-1.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "console"
                      ? "border-accent text-site-text font-bold"
                      : "border-transparent text-site-text-2 hover:text-site-text"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Console (1)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("network")}
                  className={`px-2.5 py-1.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "network"
                      ? "border-accent text-site-text font-bold"
                      : "border-transparent text-site-text-2 hover:text-site-text"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Network (500)
                </button>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium py-1">
                <IconCheck size={11} strokeWidth={2.5} />
                <span>Saved to Google Drive</span>
              </div>
            </div>

            {/* DevTools Drawer Body */}
            <div className="p-3 font-mono text-[10px] leading-relaxed">
              {activeTab === "console" ? (
                <div className="rounded bg-site-surface border border-site-border p-2 space-y-1">
                  <div className="text-red-500 font-semibold flex items-start gap-1.5">
                    <span>✕</span>
                    <span>TypeError: Cannot read properties of undefined (reading &apos;token&apos;)</span>
                  </div>
                  <div className="text-site-text-2 pl-4 text-[9px]">
                    at CheckoutButton.tsx:42:18
                  </div>
                </div>
              ) : (
                <div className="rounded bg-site-surface border border-site-border p-2 flex items-center justify-between text-site-text-2">
                  <span className="text-red-500 font-bold">POST 500</span>
                  <span className="truncate max-w-[200px]">/api/v1/charge</span>
                  <span className="text-site-text-2">812ms</span>
                </div>
              )}

              {/* System Specs Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-site-border text-[9px] text-site-text-2">
                <span className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border">Chrome 128</span>
                <span className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border">macOS 14.5</span>
                <span className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border">1920×1080</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
