"use client";

import { useState, useCallback } from "react";
import { useT } from "@/components/I18nProvider";
import {
  IconCheck,
  IconCopy,
  IconTerminal2,
  IconShare,
  IconVideo,
  IconPencil,
  IconBolt,
} from "./TablerIcons";

export function RoleSwitcher() {
  const { t } = useT();

  // Interactive feedback states for each card
  const [qaSimulating, setQaSimulating] = useState(false);
  const [devCopied, setDevCopied] = useState(false);
  const [pmCopied, setPmCopied] = useState(false);

  const handleSimulateQa = useCallback(() => {
    setQaSimulating(true);
    setTimeout(() => setQaSimulating(false), 2200);
  }, []);

  const handleCopyDevCurl = useCallback(() => {
    const curlSnippet = `curl -X POST https://checkout.acme.corp/api/v2/pay \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer [REDACTED_AUTH_TOKEN]" \\
  -d '{"orderId":"48291","amount":2400.00,"currency":"USD"}'`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(curlSnippet).catch(() => {});
    }
    setDevCopied(true);
    setTimeout(() => setDevCopied(false), 2000);
  }, []);

  const handleCopyPmTicket = useCallback(() => {
    const ticketSnippet = `## Summary
Pay button throws HTTP 502 Bad Gateway during checkout flow.

## Reproduction Steps
1. Navigate to checkout.acme.corp/pay
2. Select enterprise plan ($2,400.00)
3. Click "Pay $2,400.00" button -> request fails.

## Environment & Logs
- URL: https://checkout.acme.corp/pay
- Browser: Chrome 129 / macOS / 1920x1080
- Error: HTTP 502 Bad Gateway (GET /api/v2/workspace/metrics • 812ms)
- Trace: WorkspaceLayout.tsx:84 > useMetrics.ts:31
- Video & DevTools: Stored in team Google Drive`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ticketSnippet).catch(() => {});
    }
    setPmCopied(true);
    setTimeout(() => setPmCopied(false), 2000);
  }, []);

  return (
    <div className="w-full space-y-8 font-site">
      {/* 3-Column Role Bento Showcase - All cards directly displayed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ================================================================ */}
        {/* CARD 1: QA & QUALITY ENGINEERS                                  */}
        {/* ================================================================ */}
        <div className="group rounded-2xl border border-violet-500/25 dark:border-violet-500/20 bg-gradient-to-b from-site-surface via-site-surface to-violet-500/[0.03] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-violet-500/40 transition-all duration-200 min-w-0">
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 shrink-0">
                  <span>🧪</span>
                  <span>{t("site.roles.qa.badge")}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20 truncate">
                  {t("site.roles.qa.tag")}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-site-text tracking-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t("site.roles.qa.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.roles.qa.desc")}
                </p>
              </div>

              {/* Interactive Mockup: Screen Recorder Bar & Waveform */}
              <div className="rounded-xl border border-site-border bg-site-surface-2 overflow-hidden shadow-2xs text-xs">
                {/* Recorder Control Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-site-border bg-site-surface">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full bg-red-500 ${
                        qaSimulating ? "animate-ping" : "animate-pulse"
                      }`}
                    />
                    <span className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400">
                      REC 00:14
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-site-text-2 truncate max-w-[140px]">
                    checkout.acme.corp
                  </span>
                </div>

                {/* Simulated Audio & Screen Tracks */}
                <div className="p-3 space-y-2 bg-site-surface-2/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-site-text-2 w-10 shrink-0">
                      Screen
                    </span>
                    <div className="flex-1 h-3 rounded bg-site-border relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-[68%] bg-violet-500/40 rounded" />
                    </div>
                    <span className="text-[10px] font-mono text-site-text-2">
                      1080p
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-site-text-2 w-10 shrink-0">
                      Mic
                    </span>
                    <div className="flex items-end gap-px flex-1 h-3.5">
                      {[3, 6, 4, 7, 5, 8, 4, 6, 3, 7, 5, 8, 4, 6, 3, 5, 7, 4, 8, 5].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-xs bg-violet-500/60 transition-all"
                            style={{ height: `${h * 0.16}rem` }}
                          />
                        )
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-site-text-2">
                      Live
                    </span>
                  </div>
                </div>

                {/* Annotations & Simulator Action */}
                <div className="p-2.5 bg-site-surface border-t border-site-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[10px] font-medium border border-violet-500/20">
                      <IconPencil size={10} />
                      <span>Arrow #1</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-site-surface-2 text-site-text-2 text-[10px] font-medium border border-site-border-subtle">
                      <span>░░ Blur PII</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateQa}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-all shrink-0 active:scale-95"
                  >
                    <IconVideo size={11} />
                    <span>
                      {qaSimulating
                        ? t("site.roles.qa.simDone")
                        : t("site.roles.qa.simBtn")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Bullet Features List */}
              <ul className="space-y-2 pt-2 text-xs text-site-text">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.qa.p1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.qa.p2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.qa.p3")}</span>
                </li>
              </ul>
            </div>

            {/* Bottom Outcome Metric */}
            <div className="mt-5 pt-3 border-t border-violet-500/15 flex items-center justify-between text-[11px] text-violet-700 dark:text-violet-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <IconBolt size={13} className="text-violet-500" />
                <span>{t("site.roles.qa.metric")}</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-site-surface border border-violet-500/20 font-mono text-[9px] text-site-text-2">
                Ctrl+Shift+F
              </kbd>
            </div>
          </div>

        {/* ================================================================ */}
        {/* CARD 2: SOFTWARE ENGINEERS                                       */}
        {/* ================================================================ */}
        <div className="group rounded-2xl border border-blue-500/25 dark:border-blue-500/20 bg-gradient-to-b from-site-surface via-site-surface to-blue-500/[0.03] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-blue-500/40 transition-all duration-200 min-w-0">
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
                  <span>⚙️</span>
                  <span>{t("site.roles.dev.badge")}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 truncate">
                  {t("site.roles.dev.tag")}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-site-text tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t("site.roles.dev.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.roles.dev.desc")}
                </p>
              </div>

              {/* Interactive Mockup: DevTools Console & Network Snippet */}
              <div className="rounded-xl border border-site-border bg-site-surface-2 overflow-hidden shadow-2xs text-xs font-mono">
                {/* DevTools Tab Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-site-border bg-site-surface">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-sans font-bold text-[11px] text-site-text">
                      DevTools Diagnostics
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                    Auto-Captured
                  </span>
                </div>

                {/* Error Callout */}
                <div className="p-3 space-y-2 bg-site-surface-2/60 text-[11px]">
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                    <div className="font-bold">HTTP 502 Bad Gateway</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      GET /api/v2/workspace/metrics • 812ms
                    </div>
                  </div>

                  <div className="p-2 rounded bg-site-surface border border-site-border-subtle text-site-text text-[10px] space-y-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      Trace:{" "}
                    </span>
                    <span className="break-all text-site-text-2">
                      WorkspaceLayout.tsx:84 &gt; useMetrics.ts:31
                    </span>
                  </div>
                </div>

                {/* Interactive Copy cURL Action */}
                <div className="p-2.5 bg-site-surface border-t border-site-border flex items-center justify-between gap-2">
                  <span className="text-[10px] text-site-text-2 truncate font-mono">
                    curl -X POST /api/v2/pay...
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyDevCurl}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-sans font-bold transition-all shrink-0 active:scale-95"
                  >
                    {devCopied ? (
                      <>
                        <IconCheck size={11} strokeWidth={3} />
                        <span>{t("site.roles.dev.curlDone")}</span>
                      </>
                    ) : (
                      <>
                        <IconCopy size={11} />
                        <span>{t("site.roles.dev.curlBtn")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bullet Features List */}
              <ul className="space-y-2 pt-2 text-xs text-site-text">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.dev.p1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.dev.p2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.dev.p3")}</span>
                </li>
              </ul>
            </div>

            {/* Bottom Outcome Metric */}
            <div className="mt-5 pt-3 border-t border-blue-500/15 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <IconTerminal2 size={13} className="text-blue-500" />
                <span>{t("site.roles.dev.metric")}</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-site-surface border border-blue-500/20 font-mono text-[9px] text-site-text-2">
                Ctrl+Shift+S
              </kbd>
            </div>
          </div>

        {/* ================================================================ */}
        {/* CARD 3: PRODUCT MANAGERS                                         */}
        {/* ================================================================ */}
        <div className="group rounded-2xl border border-emerald-500/25 dark:border-emerald-500/20 bg-gradient-to-b from-site-surface via-site-surface to-emerald-500/[0.03] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-emerald-500/40 transition-all duration-200 min-w-0">
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                  <span>📋</span>
                  <span>{t("site.roles.pm.badge")}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 truncate">
                  {t("site.roles.pm.tag")}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-site-text tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t("site.roles.pm.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.roles.pm.desc")}
                </p>
              </div>

              {/* Interactive Mockup: Formatted Issue Tracker Export */}
              <div className="rounded-xl border border-site-border bg-site-surface-2 overflow-hidden shadow-2xs text-xs">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-site-border bg-site-surface">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-[11px] text-site-text">
                      Formatted Bug Report
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-site-text-2">
                    Linear / Jira
                  </span>
                </div>

                {/* Structured Markdown Preview */}
                <div className="p-3 space-y-1.5 bg-site-surface-2/60 text-[11px] font-mono">
                  <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                    ## Summary
                  </div>
                  <div className="text-site-text text-[10px] truncate">
                    Checkout button throws TypeError on click
                  </div>

                  <div className="text-emerald-700 dark:text-emerald-400 font-bold pt-1">
                    ## Environment
                  </div>
                  <div className="text-site-text-2 text-[10px]">
                    Chrome 129 / macOS / 1920x1080
                  </div>

                  <div className="text-emerald-700 dark:text-emerald-400 font-bold pt-1">
                    ## Attached Telemetry
                  </div>
                  <div className="text-site-text-2 text-[10px]">
                    1 console error • 1 HTTP 500
                  </div>
                </div>

                {/* Copy Markdown Action */}
                <div className="p-2.5 bg-site-surface border-t border-site-border flex items-center justify-between gap-2">
                  <span className="text-[10px] text-site-text-2 truncate font-mono">
                    Markdown Bug Report
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyPmTicket}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-sans font-bold transition-all shrink-0 active:scale-95"
                  >
                    {pmCopied ? (
                      <>
                        <IconCheck size={11} strokeWidth={3} />
                        <span>{t("site.roles.pm.ticketDone")}</span>
                      </>
                    ) : (
                      <>
                        <IconCopy size={11} />
                        <span>{t("site.roles.pm.ticketBtn")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bullet Features List */}
              <ul className="space-y-2 pt-2 text-xs text-site-text">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.pm.p1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.pm.p2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                  <span>{t("site.roles.pm.p3")}</span>
                </li>
              </ul>
            </div>

            {/* Bottom Outcome Metric */}
            <div className="mt-5 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <IconShare size={13} className="text-emerald-500" />
                <span>{t("site.roles.pm.metric")}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-site-surface border border-emerald-500/20 text-[9px] text-site-text-2">
                Linear / Jira
              </span>
            </div>
          </div>
        </div>

      {/* ================================================================ */}
      {/* SEAMLESS TEAM COLLABORATION WORKFLOW LOOP                        */}
      {/* ================================================================ */}
      <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-site-border">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-site-accent/10 border border-site-accent/20 text-[10px] font-bold uppercase tracking-wider text-site-accent">
              <IconShare size={11} />
              <span>{t("site.roles.loop.badge")}</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-site-text tracking-tight">
              {t("site.roles.loop.title")}
            </h4>
            <p className="text-xs text-site-text-2">{t("site.roles.loop.sub")}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shrink-0 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("site.roles.loop.live")}</span>
          </div>
        </div>

        {/* 4 Connected Process Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Step 1 */}
          <div className="relative rounded-xl border border-site-border-subtle bg-site-surface-2/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400">
                01 / QA
              </span>
              <span className="w-5 h-5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs">
                🧪
              </span>
            </div>
            <h5 className="text-xs font-bold text-site-text">
              {t("site.roles.loop.s1")}
            </h5>
            <p className="text-[11px] text-site-text-2 leading-relaxed">
              {t("site.roles.loop.s1Sub")}
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-xl border border-site-border-subtle bg-site-surface-2/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-site-accent">
                02 / Engine
              </span>
              <span className="w-5 h-5 rounded-md bg-site-accent/10 text-site-accent flex items-center justify-center text-xs font-bold">
                ⚡
              </span>
            </div>
            <h5 className="text-xs font-bold text-site-text">
              {t("site.roles.loop.s2")}
            </h5>
            <p className="text-[11px] text-site-text-2 leading-relaxed">
              {t("site.roles.loop.s2Sub")}
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-xl border border-site-border-subtle bg-site-surface-2/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                03 / Engineering
              </span>
              <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                ⚙️
              </span>
            </div>
            <h5 className="text-xs font-bold text-site-text">
              {t("site.roles.loop.s3")}
            </h5>
            <p className="text-[11px] text-site-text-2 leading-relaxed">
              {t("site.roles.loop.s3Sub")}
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative rounded-xl border border-site-border-subtle bg-site-surface-2/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                04 / Product
              </span>
              <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                📋
              </span>
            </div>
            <h5 className="text-xs font-bold text-site-text">
              {t("site.roles.loop.s4")}
            </h5>
            <p className="text-[11px] text-site-text-2 leading-relaxed">
              {t("site.roles.loop.s4Sub")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
