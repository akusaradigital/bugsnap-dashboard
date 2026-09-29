"use client";

import { useState } from "react";
import { IconCopy, IconPlayerPlay, IconCheck } from "./TablerIcons";

type Tab = "media" | "console" | "network" | "system";

const TABS: { id: Tab; label: string }[] = [
  { id: "media", label: "Media" },
  { id: "console", label: "Console" },
  { id: "network", label: "Network" },
  { id: "system", label: "System" },
];

const CONSOLE_ROWS: { level: "error" | "warn"; text: string; file: string }[] = [
  {
    level: "error",
    text: "Uncaught TypeError: Cannot read properties of undefined (reading 'amount')",
    file: "checkout.js:247",
  },
  {
    level: "error",
    text: "Failed to load resource: the server responded with a status of 500",
    file: "/api/payment/process",
  },
  {
    level: "warn",
    text: "Warning: Each child in a list should have a unique 'key' prop",
    file: "Cart.jsx:83",
  },
  {
    level: "error",
    text: "Error: Request failed with status code 500",
    file: "api/client.ts:112",
  },
];

const NETWORK_ROWS: {
  method: string;
  url: string;
  status: number;
  time: string;
}[] = [
  { method: "POST", url: "/api/payment/process", status: 500, time: "1.2s" },
  { method: "GET", url: "/api/cart/summary", status: 200, time: "84ms" },
  { method: "POST", url: "/api/analytics/event", status: 204, time: "31ms" },
];

const SYSTEM_ROWS: { label: string; value: string }[] = [
  { label: "Browser", value: "Chrome 124.0.6367.82" },
  { label: "OS", value: "macOS 14.4.1 (Sonoma)" },
  { label: "Screen", value: "1920×1080 (1× DPI)" },
  { label: "Viewport", value: "1280×720" },
  { label: "User Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  { label: "Memory", value: "8 GB" },
  { label: "Network", value: "4G (estimated)" },
];

function TabBar({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-site-surface-2 border-b border-site-border">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            active === tab.id
              ? "bg-accent text-white"
              : "text-site-text-2 hover:text-site-text hover:bg-site-surface"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MediaTab() {
  return (
    <div className="p-4 space-y-3">
      {/* Mini browser frame */}
      <div className="rounded-xl border border-site-border bg-site-surface overflow-hidden shadow-sm">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2 bg-site-surface-2 border-b border-site-border">
          <div className="flex gap-1" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>
          <span className="flex-1 text-center text-[11px] font-mono text-site-text-2 bg-site-surface px-2 py-0.5 rounded border border-site-border">
            checkout.acme.corp/payment
          </span>
        </div>

        {/* Viewport body */}
        <div className="p-4 space-y-3 bg-site-surface">
          {/* Order summary rows */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-site-text-2">
              <span>Subtotal</span>
              <span className="font-mono">$2,199.00</span>
            </div>
            <div className="flex items-center justify-between text-xs text-site-text-2">
              <span>Tax</span>
              <span className="font-mono">$201.00</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-site-text border-t border-site-border pt-1.5">
              <span>Total</span>
              <span className="font-mono">$2,400.00</span>
            </div>
          </div>

          {/* Error-highlighted Pay button */}
          <div className="relative">
            <div className="rounded-lg border-2 border-red-500 ring-2 ring-red-500/20 p-3 flex items-center justify-between bg-red-500/5">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                Pay $2,400.00
              </span>
              <span className="text-[10px] font-mono font-bold text-white bg-red-500 px-2 py-0.5 rounded">
                HTTP 500
              </span>
            </div>
            {/* BugSnap annotation arrow */}
            <div className="absolute -right-2 -top-6 flex items-center gap-1">
              <span className="text-[10px] font-semibold text-accent bg-site-surface border border-accent px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                ↙ BugSnap captured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recording info */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-site-surface-2 border border-site-border">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          REC 00:14
        </div>
        <span className="text-xs text-site-text-2 flex-1">Screen recording attached</span>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent-hover transition-colors"
          aria-label="Play recording (decorative)"
        >
          <IconPlayerPlay size={13} />
          Play recording
        </button>
      </div>
    </div>
  );
}

function ConsoleTab() {
  return (
    <div className="bg-slate-950 min-h-[280px] p-3 space-y-0.5 font-mono text-[11px]">
      {CONSOLE_ROWS.map((row, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 px-2 py-1.5 rounded border-l-2 ${
            row.level === "error"
              ? "border-red-500 bg-red-500/10"
              : "border-yellow-500 bg-yellow-500/10"
          }`}
        >
          <span
            className={`shrink-0 font-bold ${
              row.level === "error" ? "text-red-400" : "text-yellow-400"
            }`}
          >
            {row.level === "error" ? "✕" : "⚠"}
          </span>
          <span
            className={`flex-1 leading-snug ${
              row.level === "error" ? "text-red-300" : "text-yellow-300"
            }`}
          >
            {row.text}
          </span>
          <span className="shrink-0 text-slate-500 text-[10px] whitespace-nowrap self-center">
            {row.file}
          </span>
        </div>
      ))}
    </div>
  );
}

function NetworkTab() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="bg-slate-950 min-h-[280px] p-3 space-y-1 font-mono text-[11px]">
      {NETWORK_ROWS.map((row, i) => {
        const isError = row.status >= 400;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-900 border border-slate-800">
              {/* Method pill */}
              <span
                className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  row.method === "POST"
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {row.method}
              </span>

              {/* URL */}
              <span className="flex-1 text-slate-300 truncate">{row.url}</span>

              {/* Status badge */}
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                  isError
                    ? "bg-red-500/20 text-red-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {row.status}
              </span>

              {/* Time */}
              <span className="shrink-0 text-slate-500 text-[10px]">{row.time}</span>
            </div>

            {/* "Copy as cURL" only under the 500 row */}
            {isError && (
              <div className="pl-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <IconCheck size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <IconCopy size={11} />
                      Copy as cURL
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SystemTab() {
  return (
    <div className="p-4 min-h-[280px] bg-site-surface-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
        {SYSTEM_ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-2 py-2 border-b border-site-border last:border-0"
          >
            <span className="text-xs text-site-text-2 shrink-0">{row.label}</span>
            <span className="text-xs font-mono text-site-text text-right truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveBugReportViewer() {
  const [activeTab, setActiveTab] = useState<Tab>("media");

  return (
    <div className="max-w-3xl mx-auto rounded-2xl border border-site-border bg-site-surface shadow-lg overflow-hidden">
      <TabBar active={activeTab} onSelect={setActiveTab} />
      <div className="min-h-[280px]">
        {activeTab === "media" && <MediaTab />}
        {activeTab === "console" && <ConsoleTab />}
        {activeTab === "network" && <NetworkTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}
