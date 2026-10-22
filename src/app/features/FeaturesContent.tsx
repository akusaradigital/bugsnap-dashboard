"use client";

import { useState } from "react";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { PillTabs } from "@/components/site/PillTabs";
import { IconCheck, IconTerminal2, IconShieldCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

type FeatureCategory = "all" | "telemetry" | "capture" | "security" | "export";

export function FeaturesContent() {
  const { t } = useT();
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>("all");

  const categories = [
    { id: "all" as const, label: t("features.catAll"), badge: "Overview" },
    { id: "telemetry" as const, label: t("features.catTelemetry"), badge: "Telemetry" },
    { id: "capture" as const, label: t("features.catCapture"), badge: "Studio" },
    { id: "security" as const, label: t("features.catSecurity"), badge: "Privacy" },
    { id: "export" as const, label: t("features.catExport"), badge: "Automation" },
  ];

  const showTelemetry = activeCategory === "all" || activeCategory === "telemetry";
  const showCapture = activeCategory === "all" || activeCategory === "capture";
  const showSecurity = activeCategory === "all" || activeCategory === "security";
  const showExport = activeCategory === "all" || activeCategory === "export";

  return (
    <StaticShell
      title={t("features.title") || "Technical Capabilities & Specifications"}
      subtitle={t("features.subtitle") || "Deep technical diagnostics, high-definition recording, and client-side privacy architecture."}
    >
      <div className="space-y-16 font-site">
        {/* Category Filter Tabs */}
        <div className="flex justify-center">
          <PillTabs
            tabs={categories}
            activeTab={activeCategory}
            onChange={(id) => setActiveCategory(id as FeatureCategory)}
          />
        </div>

        {/* Technical Capabilities Matrix */}
        <div className="space-y-10">
          {/* Spec 1: DevTools Telemetry Engine */}
          {showTelemetry && (
            <Reveal delay={0.06}>
              <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 min-w-0 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <IconTerminal2 size={13} aria-hidden="true" />
                      <span>Diagnostics Engine</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      Automated Console & Network Telemetry
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      BugSnap silently intercepts browser runtime errors without proxying your traffic through third-party servers. When an issue occurs, the full diagnostic payload is attached automatically.
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-1">
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>Console Logs:</strong> Unhandled exceptions, stack traces, warnings, and info logs with exact source-mapped line numbers.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>Network Waterfalls:</strong> Method, URL, HTTP status codes, latency timings, and request/response headers.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>Environment Fingerprint:</strong> Chrome build, OS version, viewport dimensions, screen scale (DPR), and memory stats.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 min-w-0">
                    <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans text-site-text-2">
                        <span className="font-semibold text-xs text-site-text">Schema: captures.dev_logs (JSONB)</span>
                        <span className="text-[10px] text-site-accent font-bold">Auto-Indexed</span>
                      </div>
                      <pre className="text-[11px] text-site-text-2 overflow-x-auto p-3 rounded bg-site-surface border border-site-border-subtle leading-relaxed">
{`{
  "console": [
    {
      "level": "error",
      "message": "Uncaught TypeError: Cannot read 'checkoutSessionId'",
      "stack": "submitPayment (flow.ts:148:19) -> main.js:4:8120",
      "timestamp": 1728908524012
    }
  ],
  "network": [
    {
      "method": "POST",
      "url": "/api/v1/checkout/charge-token",
      "status": 500,
      "duration_ms": 842,
      "type": "1st-party"
    }
  ],
  "system": {
    "browser": "Chrome 129.0.6668.89",
    "os": "macOS Sequoia 15.1",
    "viewport": "1920x1080",
    "dpr": 2.0
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Spec 2: 60 FPS Video & Audio Studio */}
          {showCapture && (
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
                    <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-site shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle">
                        <span className="font-semibold text-xs text-site-text">MediaStream Encoding Benchmark</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Hardware Accelerated
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-1">
                          <div className="text-site-text-2 text-[10px]">Video Codec</div>
                          <div className="font-bold text-site-text font-mono">VP9 / WebM 1080p</div>
                          <div className="text-[10px] text-emerald-500">60 FPS Constant Frame Rate</div>
                        </div>
                        <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-1">
                          <div className="text-site-text-2 text-[10px]">Audio Codec</div>
                          <div className="font-bold text-site-text font-mono">Opus 48 kHz</div>
                          <div className="text-[10px] text-emerald-500">Dual Mic + Tab Mixing</div>
                        </div>
                        <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-1">
                          <div className="text-site-text-2 text-[10px]">Screen Modes</div>
                          <div className="font-bold text-site-text">Full Display / Window / Tab</div>
                          <div className="text-[10px] text-site-text-2">Automatic DPR normalization</div>
                        </div>
                        <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-1">
                          <div className="text-site-text-2 text-[10px]">DOM Replay</div>
                          <div className="font-bold text-site-text font-mono">rrweb v2 Mutation Stream</div>
                          <div className="text-[10px] text-site-text-2">Virtual DOM sandbox playback</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 min-w-0 order-1 lg:order-2 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <Icon icon="lucide:video" className="w-3 h-3 text-site-accent" aria-hidden="true" />
                      <span>Recording Studio</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      High-Definition Visual Studio & Annotations
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      Capture crystal-clear 1080p video with simultaneous microphone audio and system sound. Built-in vector drawing tools allow you to annotate steps before saving.
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-1">
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                        <span>Interactive canvas toolbar: arrows, rectangles, freehand drawing, and text callouts.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                        <span>Visual click ripples record exact coordinate interactions for user reproduction.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                        <span>DOM Replay mode stores DOM mutations for inspectable in-browser simulation.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Spec 3: Privacy & Data Masking Engine */}
          {showSecurity && (
            <Reveal delay={0.14}>
              <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 min-w-0 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <IconShieldCheck size={13} aria-hidden="true" />
                      <span>Data Sovereignty</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      Client-Side Redaction & Zero Server Retention
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      BugSnap is engineered so that your sensitive company data never touches intermediate vendor servers. Recordings stream straight to your authorized Google Drive.
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-1">
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>Automatic Header Stripping:</strong> Bearer tokens, Authorization keys, and Set-Cookie headers are wiped in memory before transmission.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>Selective Canvas Blur:</strong> Obscure credit cards, personal addresses, or API keys directly on screen with the vector blur tool.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>Restricted OAuth:</strong> We only request the <code>drive.file</code> scope: BugSnap can only access files it created, never your personal documents.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 min-w-0">
                    <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans">
                        <span className="font-semibold text-xs text-site-text">Redaction Rules Applied</span>
                        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">100% Client-Side</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="p-2.5 rounded bg-site-surface border border-site-border space-y-1">
                          <div className="text-[10px] text-site-text-2">Regex: /Bearer\s+([A-Za-z0-9\-\._~\+\/]+=*)/gi</div>
                          <div className="text-site-text flex items-center justify-between">
                            <span>Input: Bearer eyJhbGciOi...</span>
                            <span className="text-site-accent font-bold">&rarr; [REDACTED_JWT]</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded bg-site-surface border border-site-border space-y-1">
                          <div className="text-[10px] text-site-text-2">Storage: Google Drive AES-256</div>
                          <div className="text-site-text flex items-center justify-between">
                            <span>BugSnap Server Storage:</span>
                            <span className="text-emerald-500 font-bold">0 KB (Ephemeral)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Spec 5: SPA Health & Memory Leak Detector */}
          {showTelemetry && (
            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 min-w-0 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-500 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <Icon icon="lucide:activity" className="w-3 h-3 text-amber-500" aria-hidden="true" />
                      <span>SPA Diagnostics</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      SPA Memory Leak & DOM Bloat Detector
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      Single Page Applications (React, Vue, Next.js) easily leak unmounted DOM nodes and retained closures. BugSnap continuously profiles heap allocation and element retention across client-side route transitions.
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-1">
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>DOM Bloat Guard:</strong> Automatic warnings when total elements exceed the 1,500 node benchmark or explode past 3,000 elements.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>JS Heap Tracking:</strong> Records initial, peak, and delta heap memory in MB to pinpoint dangling timers and detached subtrees.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span><strong>SPA Health Card:</strong> Evaluates route change health automatically and displays warnings in both the extension editor and web DevTools.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 min-w-0">
                    <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans">
                        <span className="font-semibold text-xs text-site-text">Telemetry: PerformanceLog.metrics</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                          Alert Thresholds
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                        <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-1">
                          <span className="text-site-text-2 text-[10px] uppercase font-bold">DOM Retention</span>
                          <div className="text-base font-extrabold font-mono text-site-text">1,840 nodes</div>
                          <span className="text-[10px] text-amber-500 font-semibold">+115% growth on /checkout</span>
                        </div>
                        <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-1">
                          <span className="text-site-text-2 text-[10px] uppercase font-bold">JS Heap Delta</span>
                          <div className="text-base font-extrabold font-mono text-amber-500">+48 MB</div>
                          <span className="text-[10px] text-site-text-2">Unreleased closures</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                        <strong>Health Notice:</strong> Detached DOM nodes retained after route change. Flagged in DevTools Issues tab.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Spec 6: Automated Playwright Tests & AI MCP Server */}
          {showExport && (
            <Reveal delay={0.22}>
              <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
                    <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans">
                        <span className="font-semibold text-xs text-site-text">Auto-Generated @playwright/test</span>
                        <span className="text-[10px] text-[#6B9A35] dark:text-[#A8D666] font-bold bg-[#89BD49]/10 px-2 py-0.5 rounded">
                          Playwright Ready
                        </span>
                      </div>
                      <pre className="text-[10px] text-site-text p-3 rounded bg-site-surface border border-site-border-subtle leading-relaxed overflow-x-auto">
{`import { test, expect } from '@playwright/test';

test('reproduce checkout failure', async ({ page }) => {
  await page.goto('https://app.acme.corp/checkout');
  await page.getByRole('button', { name: 'Apply Coupon' }).click();
  await page.locator('#coupon-code').fill('DISCOUNT50');
  await page.getByRole('button', { name: 'Pay' }).click();

  // Expect network failure toast
  await expect(page.locator('.toast-error')).toBeVisible();
});`}
                      </pre>
                      <div className="flex items-center justify-between text-[10px] font-sans text-site-text-2 pt-1 border-t border-site-border-subtle">
                        <span>Native MCP Endpoint: /api/mcp</span>
                        <span className="text-site-accent font-semibold">Claude Code &amp; Cursor AI</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 min-w-0 order-1 lg:order-2 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <Icon icon="lucide:bot" className="w-3 h-3 text-site-accent" aria-hidden="true" />
                      <span>Automation &amp; AI</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      Playwright Regression Tests &amp; AI MCP Server
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      Close the loop between QA and engineering. BugSnap analyzes user action breadcrumbs to synthesize reproducible Playwright scripts, and provides a native Model Context Protocol (MCP) server so AI coding assistants can diagnose bugs directly.
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-1">
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                        <span>Instant Playwright scripts generated from real user clicks and form interactions.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                        <span>Native Model Context Protocol (MCP) server integration for Claude Code, Cursor, and Windsurf.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" aria-hidden="true" />
                        <span>Interactive Before/After split-screen compare slider to verify UI bug fixes.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Technical Docs Link & Callout */}
        <Reveal delay={0.24}>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface p-6 sm:p-8 lg:p-10 shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-40"
              style={{
                background: "radial-gradient(ellipse 70% 60% at 50% -10%, var(--glow-primary), transparent 70%)",
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-w-0">
              <div className="space-y-1.5 text-left min-w-0 flex-1">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-site-accent">
                  Developer Documentation
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                  Inspect the full technical telemetry schema
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                  Explore our API reference, Google Drive OAuth specifications, and Model Context Protocol (MCP) server guide.
                </p>
              </div>
              <div className="shrink-0 flex flex-wrap gap-3">
                <a
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs sm:text-sm font-semibold px-5 py-3 min-h-[44px] rounded-xl transition-colors"
                >
                  <span>Read Developer Docs</span>
                </a>
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99]"
                >
                  <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t("features.ctaButton") || "Add to Chrome - Free"}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
