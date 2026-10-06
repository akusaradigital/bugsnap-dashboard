"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "./TablerIcons";

type IntegrationKey = "linear" | "jira" | "github" | "slack";

export function IntegrationSwitcher() {
  const [active, setActive] = useState<IntegrationKey>("linear");
  const [copied, setCopied] = useState(false);

  const copyPayload = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrations: { key: IntegrationKey; label: string; iconSrc: string }[] = [
    { key: "linear", label: "Linear", iconSrc: "/integrations/linear.png" },
    { key: "jira", label: "Jira", iconSrc: "/integrations/jira.png" },
    { key: "github", label: "GitHub", iconSrc: "/integrations/github.png" },
    { key: "slack", label: "Slack", iconSrc: "/integrations/slack.png" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Switcher Tab Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {integrations.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              active === item.key
                ? "border-accent bg-accent text-slate-900 shadow-sm"
                : "border-site-border bg-site-surface text-site-text-2 hover:text-site-text hover:border-site-border-focus"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.iconSrc} alt="" className="w-4 h-4 object-contain" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Preview Container */}
      <div className="rounded-2xl border border-site-border bg-site-surface shadow-xl overflow-hidden font-site">
        {/* Top Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-4 py-3 border-b border-site-border bg-site-surface-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-site-text">1-Click BugSnap Output: {active.toUpperCase()}</span>
          </div>
          <button
            type="button"
            onClick={copyPayload}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-site-surface border border-site-border text-site-text-2 hover:text-site-text font-medium text-[11px] transition-colors shrink-0"
          >
            {copied ? <IconCheck size={12} className="text-emerald-500" /> : <IconCopy size={12} />}
            <span>{copied ? "Copied!" : "Copy Report"}</span>
          </button>
        </div>

        {/* Content based on Active Integration */}
        <div className="p-4 sm:p-6">
          {active === "linear" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-site-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono text-xs font-bold">
                    ENG-1042
                  </span>
                  <span className="text-sm font-bold text-site-text">Checkout button throws TypeError on $2,400 pay</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  In Progress
                </span>
              </div>
              <div className="text-xs font-mono text-site-text-2 space-y-2 bg-site-surface-2 p-4 rounded-xl border border-site-border">
                <p className="text-site-text font-sans font-semibold">Reproduction Video & Context:</p>
                <p className="text-emerald-600 dark:text-emerald-400">▶ https://bugsnap.akusaraproject.my.id/v/8f921a (00:14)</p>
                <p className="text-red-500 font-bold mt-2">Console Error:</p>
                <p className="text-site-text">Uncaught TypeError: Cannot read properties of undefined (reading &apos;token&apos;)</p>
                <p className="text-site-text-2">at CheckoutButton.tsx:42:18</p>
                <div className="flex gap-2 pt-2 text-[10px] text-site-text-2 border-t border-site-border">
                  <span>Chrome 128</span> · <span>macOS 14.5</span> · <span>1920×1080</span>
                </div>
              </div>
            </div>
          )}

          {active === "jira" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-site-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
                    PROD-4891
                  </span>
                  <span className="text-sm font-bold text-site-text">[BugSnap] HTTP 500 on POST /api/v1/charge</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                  Priority: High
                </span>
              </div>
              <div className="text-xs space-y-2 bg-site-surface-2 p-4 rounded-xl border border-site-border">
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-site-border text-[11px]">
                  <div><span className="text-site-text-2">Reporter:</span> <span className="font-semibold text-site-text">Sarah (QA Lead)</span></div>
                  <div><span className="text-site-text-2">Environment:</span> <span className="font-semibold text-site-text">Staging EU-West</span></div>
                </div>
                <p className="font-mono text-emerald-600 dark:text-emerald-400">Attached Drive Capture: bugsnap-session-2026-09.webm (12.4 MB)</p>
                <p className="font-mono text-red-500 text-[11px]">HTTP 500 Internal Server Error (812ms response latency)</p>
              </div>
            </div>
          )}

          {active === "github" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-site-border pb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Open
                </span>
                <span className="text-sm font-bold text-site-text">fix(checkout): unhandled promise rejection in token parse #329</span>
              </div>
              <div className="text-xs font-mono text-site-text-2 bg-site-surface-2 p-4 rounded-xl border border-site-border space-y-2">
                <p className="text-site-text font-sans font-semibold">### Steps to Reproduce</p>
                <p>1. Open /checkout with cart item &gt; $1,000</p>
                <p>2. Click Pay Now without pre-selected address</p>
                <p className="text-site-text font-sans font-semibold pt-2">### Automated Diagnostics</p>
                <p className="text-emerald-600 dark:text-emerald-400">[Watch Session Video](https://bugsnap.akusaraproject.my.id/v/8f921a)</p>
                <div className="p-2 rounded bg-site-surface border border-site-border text-[10px] text-red-500">
                  TypeError: authPayload.token is undefined at line 42
                </div>
              </div>
            </div>
          )}

          {active === "slack" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-600 text-xs">
                  BS
                </div>
                <div>
                  <span className="text-xs font-bold text-site-text">BugSnap Bot</span>
                  <span className="text-[10px] text-site-text-2 ml-2">APP · Just now</span>
                </div>
              </div>
              <div className="border-l-4 border-red-500 pl-3 py-1 space-y-1.5 text-xs bg-site-surface-2 p-3 rounded-r-lg">
                <p className="font-bold text-site-text">🚨 New Critical Bug Recorded in #checkout-staging</p>
                <p className="text-site-text-2">Sarah captured an error on <span className="font-mono text-site-text">app.acme.corp/checkout</span></p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="https://bugsnap.akusaraproject.my.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded bg-site-surface border border-site-border text-[11px] font-bold text-accent shrink-0"
                  >
                    View Interactive Player
                  </a>
                  <span className="text-[10px] text-site-text-2">Console: 1 Error · Network: HTTP 500</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
