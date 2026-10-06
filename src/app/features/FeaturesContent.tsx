"use client";

import { useState } from "react";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import {
  DevToolsCard,
  GoogleDriveProofCard,
  ExportTicketCard,
} from "@/components/site/ProductMockups";
import { HotkeyCommandBar } from "@/components/site/HotkeyCommandBar";
import { PillTabs } from "@/components/site/PillTabs";
import { IconCheck, IconBolt, IconShieldCheck, IconFolder, IconTerminal2 } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

type FeatureCategory = "all" | "capture" | "devtools" | "storage";

export function FeaturesContent() {
  const { t } = useT();
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>("all");

  const categories = [
    { id: "all" as const, label: t("features.catAll") || "All Features", badge: "Overview" },
    { id: "capture" as const, label: t("features.catCapture") || "Screen & Video", badge: "HD" },
    { id: "devtools" as const, label: t("features.catDevTools") || "DevTools Logs", badge: "Auto" },
    { id: "storage" as const, label: t("features.catStorage") || "Google Drive", badge: "100% Private" },
  ];

  const showCapture = activeCategory === "all" || activeCategory === "capture";
  const showDevTools = activeCategory === "all" || activeCategory === "devtools";
  const showStorage = activeCategory === "all" || activeCategory === "storage";

  return (
    <StaticShell
      title={t("features.title") || "Features"}
      subtitle={t("features.subtitle") || "Everything you need to capture, diagnose, and fix bugs in seconds."}
    >
      <div className="space-y-16">
        {/* Filter Tabs */}
        <div className="flex justify-center">
          <PillTabs
            tabs={categories}
            activeTab={activeCategory}
            onChange={(id) => setActiveCategory(id)}
          />
        </div>

        {/* Bento Grid Features */}
        <div className="space-y-10">
          {/* Feature 1: Instant Capture */}
          {showCapture && (
            <Reveal delay={0.06}>
              <div className="relative overflow-hidden rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 p-6 sm:p-10 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-6 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <IconBolt size={12} />
                      {t("features.f1Eyebrow") || "Instant Screen Recorder"}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      {t("features.f1Title") || "Capture Screen, Audio & Clicks in Seconds"}
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      {t("features.f1Desc") ||
                        "Record full screens, specific windows, or Chrome tabs with voice narration. Annotate screenshots with arrows, boxes, blur, and step counters before sharing."}
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-2">
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" />
                        <span>{t("features.f1HotkeyScreen") || "Ctrl+Shift+S: Area & full-page screenshot"}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" />
                        <span>{t("features.f1HotkeyVideo") || "Ctrl+Shift+F: Instant HD screen recording"}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" />
                        <span>{t("features.f1Editor") || "Built-in canvas editor with blur tool for sensitive data"}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6">
                    <HotkeyCommandBar />
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Feature 2: DevTools Telemetry */}
          {showDevTools && (
            <Reveal delay={0.12}>
              <div className="relative overflow-hidden rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 p-6 sm:p-10 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-6 order-2 lg:order-1">
                    <DevToolsCard />
                  </div>

                  <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <IconTerminal2 size={12} />
                      {t("features.f2Eyebrow") || "Automated Diagnostics"}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      {t("features.f2Title") || "Console & Network Logs Captured Silently"}
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      {t("features.f2Desc") ||
                        "Non-technical teammates don't need to know Inspect Element. BugSnap automatically attaches console exceptions, 4xx/5xx network failures, and environment specs to every recording."}
                    </p>
                    <div className="p-3.5 rounded-xl border border-site-border bg-site-surface-2/70 text-xs text-site-text-2 space-y-1">
                      <div className="font-semibold text-site-text">What gets attached automatically:</div>
                      <div>• JavaScript unhandled exceptions with full stack traces</div>
                      <div>• Failed network requests (status code, headers, URL, payload)</div>
                      <div>• Browser version, OS, viewport dimensions, screen scale</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Feature 3: Drive Storage & Collaboration */}
          {showStorage && (
            <Reveal delay={0.18}>
              <div className="relative overflow-hidden rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 p-6 sm:p-10 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-6 space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                      <IconFolder size={12} />
                      {t("features.f3Eyebrow") || "100% Data Ownership"}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                      {t("features.f3Title") || "Saved in YOUR Google Drive, Not Our Cloud"}
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed">
                      {t("features.f3Desc") ||
                        "No proprietary lock-in. No storage paywalls. Every screenshot and video is uploaded straight to your Google Drive account. You own the files forever."}
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-site-text pt-2">
                      <li className="flex items-center gap-2">
                        <IconShieldCheck size={16} className="text-site-accent shrink-0" />
                        <span>Zero server storage: we never hold a copy of your files</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" />
                        <span>Shareable link works for anyone — viewers don&apos;t need BugSnap</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={16} className="text-site-accent shrink-0" />
                        <span>Interactive player with timestamped feedback directly on the video</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6">
                    <GoogleDriveProofCard />
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Feature 4: Linear / Jira Export Mockup */}
          <Reveal delay={0.24}>
            <div className="relative overflow-hidden rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 p-6 sm:p-10 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <ExportTicketCard />
                </div>
                <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                    Integration Ready
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                    Copy to Jira, Linear, GitHub, or Slack in 1 Click
                  </h2>
                  <p className="text-sm text-site-text-2 leading-relaxed">
                    Formatted Markdown tickets ready to paste. Developers get steps to reproduce, video link, and exact error stack trace right inside their issue tracker.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom Callout */}
        <Reveal delay={0.3}>
          <div className="relative overflow-hidden rounded-3xl border border-site-border bg-gradient-to-br from-site-surface via-site-surface to-site-surface-2 p-8 sm:p-14 text-center shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-40"
              style={{
                background: "radial-gradient(ellipse 70% 60% at 50% -10%, var(--glow-primary), transparent 70%)",
              }}
            />
            <div className="relative z-10 space-y-4 max-w-xl mx-auto">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-site-accent px-3 py-1 rounded-full bg-site-accent/10 border border-site-accent/20">
                Get Started in 30 Seconds
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-site-text tracking-tight">
                {t("features.ctaTitle") || "Start reporting bugs that actually get fixed"}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                {t("features.ctaDesc") ||
                  "Free. No credit card required. Installs directly to Chrome."}
              </p>
              <div className="pt-3">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
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
