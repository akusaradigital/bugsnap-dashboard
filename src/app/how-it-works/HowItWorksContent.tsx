"use client";

import { useState } from "react";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HowItWorksContent() {
  const { t } = useT();
  const [activeStep, setActiveStep] = useState(0);

  const workflowStages = [
    {
      number: "01",
      badge: "Trigger",
      title: "Trigger Instant Capture on Any Active Tab",
      roleText: "The user presses Ctrl+Shift+S (screenshot) or Ctrl+Shift+F (recording)",
      desc: "BugSnap's lightweight service worker activates immediately without reloading the page. It begins passively buffering recent console warnings and network request headers into local memory so you never miss an error that happened a second ago.",
      metrics: "0ms tab latency · No reload required",
      preview: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 font-mono text-xs shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans text-site-text-2">
            <span className="text-[11px] font-semibold text-site-text">Background Trigger Event</span>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text flex items-center justify-between">
              <span>Shortcut: <span className="text-site-accent font-bold">Ctrl+Shift+F</span></span>
              <span className="text-[10px] text-site-text-2">Captured 14:22:01</span>
            </div>
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text-2 text-[10px]">
              &gt; Passive DevTools listener hooked to active window tab: checkout.acme.corp
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      badge: "Record & Annotate",
      title: "Record with Voice Narration, Click Ripples & Canvas Markup",
      roleText: "Demonstrate the exact reproduction steps with visual clarity",
      desc: "Record your entire screen, an application window, or a specific tab at 60 FPS. Speak into your microphone to narrate what you expected versus what actually happened. Visual click ripples pinpoint every interaction automatically.",
      metrics: "60 FPS VP9 WebM · High-fidelity Opus audio",
      preview: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-site shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-xs text-site-text">Active Recording HUD</span>
            </div>
            <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
              REC 00:18
            </span>
          </div>
          <div className="p-3 rounded-lg bg-site-surface border border-site-border space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-site-text font-medium">Element Click: button#btn-pay</span>
              <span className="text-site-accent font-mono text-[10px]">Auto-tracked</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-site-text-2">
              <Icon icon="lucide:mic" className="w-3.5 h-3.5 text-site-accent" />
              <span>Voice: &quot;Clicking pay fails with an infinite spinner...&quot;</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "03",
      badge: "Redact",
      title: "Automatic Client-Side Privacy Redaction",
      roleText: "Protect sensitive data before the capture ever leaves your tab",
      desc: "BugSnap's in-browser sanitization engine automatically scrubs authorization bearer tokens, passwords, and sensitive cookies from the technical logs. Use the built-in canvas blur tool to obscure any private onscreen customer information.",
      metrics: "Zero PII leakage · Client-side regex engine",
      preview: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 font-mono text-xs shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans">
            <span className="text-[11px] font-semibold text-site-text">In-Memory Sanitizer</span>
            <span className="text-[10px] text-site-accent font-bold bg-site-accent/10 px-2 py-0.5 rounded">Masked</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text-2 space-y-1">
              <div className="text-[10px] text-site-text-2">Authorization Header:</div>
              <div className="text-emerald-500 font-semibold">[REDACTED_BEARER_TOKEN]</div>
            </div>
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text-2 space-y-1">
              <div className="text-[10px] text-site-text-2">Password input field:</div>
              <div className="text-emerald-500 font-semibold">•••••••••••• (Auto-blurred)</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "04",
      badge: "Direct Sync",
      title: "Stream Directly to Your Enterprise Google Drive",
      roleText: "100% data sovereignty with zero third-party cloud server storage",
      desc: "Video chunks and JSON telemetry stream directly from your browser to your authorized Google Drive folder using the restricted drive.file OAuth scope. BugSnap never stores your media on intermediate proxy servers.",
      metrics: "OAuth 2.0 drive.file · AES-256 at rest",
      preview: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-site shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle">
            <div className="flex items-center gap-2">
              <Icon icon="logos:google-drive" className="w-3.5 h-3.5" />
              <span className="font-semibold text-xs text-site-text">My Drive / BugSnap</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              0 KB on BugSnap
            </span>
          </div>
          <div className="p-2.5 rounded bg-site-surface border border-site-border font-mono text-[11px] space-y-1">
            <div className="text-site-text flex items-center justify-between">
              <span className="truncate">capture-checkout-error.webm</span>
              <span className="text-site-text-2 text-[10px]">14.2 MB</span>
            </div>
            <div className="text-site-text-2 text-[10px]">Location: /Google Drive/BugSnap/2026-10/</div>
          </div>
        </div>
      ),
    },
    {
      number: "05",
      badge: "Triage & Fix",
      title: "1-Click Developer Triage & Issue Export",
      roleText: "Engineers get the exact reproduction payload instantly",
      desc: "The recipient opens the interactive share link in any browser without signing up. They see the video player synchronized with console stack traces, network waterfalls, and a copyable cURL command ready to paste into their terminal.",
      metrics: "Linear, Jira & GitHub Markdown · cURL ready",
      preview: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans">
            <span className="text-[11px] font-semibold text-site-text">1-Click Bug Resolution</span>
            <span className="text-[10px] text-site-accent font-bold bg-site-accent/10 px-2 py-0.5 rounded">Export Ready</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text">
              <div className="text-site-accent font-bold">Linear Ticket Formatted:</div>
              <div className="text-site-text-2 text-[10px] mt-0.5">## [Bug] HTTP 500 on Checkout</div>
              <div className="text-[10px] text-site-text-2">Stack: flow.ts:148 &gt; submitPayment()</div>
            </div>
            <div className="p-2 rounded bg-site-surface border border-site-border text-emerald-500 font-bold text-[10px] flex items-center justify-between">
              <span>Reproduced in 30 seconds</span>
              <span className="text-site-text-2 font-normal font-sans">Zero back-and-forth</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "06",
      badge: "Automate & AI Fix",
      title: "Generate Playwright Tests & Fix with AI",
      roleText: "Close the QA-to-Code loop automatically",
      desc: "BugSnap converts user action breadcrumbs into executable @playwright/test code. Connect your AI coding assistant (Claude Code, Cursor, Windsurf) via our native Model Context Protocol (MCP) server to diagnose root causes and propose fixes instantly.",
      metrics: "@playwright/test · MCP Server for AI",
      preview: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle font-sans">
            <span className="text-[11px] font-semibold text-site-text">Playwright + AI MCP</span>
            <span className="text-[10px] text-[#6B9A35] dark:text-[#A8D666] font-bold bg-[#89BD49]/10 px-2 py-0.5 rounded">CI Ready</span>
          </div>
          <pre className="p-2.5 rounded bg-site-surface border border-site-border text-[10px] text-site-text overflow-x-auto leading-relaxed">
{`test('checkout error', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.locator('.toast-error')).toBeVisible();
});`}
          </pre>
          <div className="flex items-center justify-between text-[10px] text-site-text-2 pt-1 border-t border-site-border-subtle">
            <span>MCP endpoint: /api/mcp</span>
            <span className="text-site-accent font-semibold">Claude Code / Cursor synced</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <StaticShell
      breadcrumb={t("site.nav.howItWorks") || "How it works"}
      title={t("howItWorks.title") || "The End-to-End Bug Resolution Lifecycle"}
      subtitle={
        t("howItWorks.subtitle") ||
        "From the moment a bug occurs on screen to the developer committing a verified fix."
      }
    >
      <div className="space-y-16">
        {/* Step Selector Pills for Fast Navigation */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 max-w-full">
          {workflowStages.map((stage, idx) => (
            <button
              key={stage.number}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeStep === idx
                  ? "bg-site-accent text-slate-900 shadow-sm shadow-site-accent/20"
                  : "bg-site-surface border border-site-border text-site-text-2 hover:text-site-text hover:bg-site-surface-2"
              }`}
            >
              <span className="font-mono text-[10px]">{stage.number}</span>
              <span>{stage.badge}</span>
            </button>
          ))}
        </div>

        {/* Chronological 5-Stage Timeline */}
        <div className="space-y-8">
          {workflowStages.map((stage, i) => (
            <Reveal key={stage.number} delay={i * 0.06}>
              <div
                className={`relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-2xl border transition-all ${
                  activeStep === i
                    ? "border-site-accent/60 bg-site-surface shadow-md ring-1 ring-site-accent/30"
                    : "border-site-border bg-site-surface/70 hover:border-site-border-focus"
                }`}
              >
                {/* Text Description */}
                <div className="lg:col-span-7 min-w-0 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-site-accent px-2 py-0.5 rounded bg-site-accent/10 border border-site-accent/20">
                      STAGE {stage.number}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-site-text-2">
                      {stage.badge}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
                    {stage.title}
                  </h2>

                  <p className="text-xs font-semibold text-site-accent">
                    {stage.roleText}
                  </p>

                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                    {stage.desc}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-site-text-2">
                    <Icon icon="lucide:check-circle-2" className="w-3.5 h-3.5 text-site-accent shrink-0" />
                    <span>{stage.metrics}</span>
                  </div>
                </div>

                {/* Stage Preview Visual */}
                <div className="lg:col-span-5 min-w-0">
                  {stage.preview}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Contextual Bottom CTA */}
        <Reveal delay={0.3}>
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
                  {t("howItWorks.ctaEyebrow") || "Ready to Streamline Triage?"}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                  {t("howItWorks.ctaTitle") || "Experience the complete 5-stage lifecycle"}
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                  {t("howItWorks.ctaDesc") || "Install the BugSnap extension in 10 seconds and file your first automated bug report."}
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99] touch-manipulation whitespace-nowrap"
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
