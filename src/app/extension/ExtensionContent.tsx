"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { BrowserFrame } from "@/components/site/BrowserFrame";
import { IconCamera, IconWorld, IconDatabase } from "@/components/site/TablerIcons";
import { Reveal, Parallax } from "@/components/site/motion";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function ExtensionContent() {
  const { t } = useT();

  const capabilities = [
    {
      title: t("extension.f1Title"),
      desc: t("extension.f1Desc"),
      badge: "Fast Capture",
      icon: <IconCamera size={16} className="text-accent" />,
    },
    {
      title: t("extension.f2Title"),
      desc: t("extension.f2Desc"),
      badge: "No Barriers",
      icon: <IconWorld size={16} className="text-accent" />,
    },
    {
      title: t("extension.f3Title"),
      desc: t("extension.f3Desc"),
      badge: "Direct Cloud",
      icon: <IconDatabase size={16} className="text-accent" />,
    },
  ];

  return (
    <StaticShell
      title={t("extension.heroTitle")}
      subtitle={t("extension.heroSub")}
    >
      <div className="space-y-16">
        {/* Hero Product Visual: Extension inside BrowserFrame with Parallax Backdrop */}
        <div className="relative max-w-3xl mx-auto">
          {/* Subtle Parallax Floating Backdrop Element with Theme Gradient */}
          <div className="absolute -inset-4 sm:-inset-6 -z-10 pointer-events-none" aria-hidden="true">
            <Parallax offset={20} className="w-full h-full">
              <div className="w-full h-full rounded-3xl border border-accent/20 bg-gradient-to-tr from-accent/15 via-emerald-500/10 to-transparent blur-md" />
            </Parallax>
          </div>

          <BrowserFrame
            url="https://app.acme.corp/dashboard"
            headerRight={
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-site-border bg-site-surface text-[11px] font-semibold text-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5" />
                <span>BugSnap Active</span>
              </div>
            }
          >
            {/* Target App Background Mockup */}
            <div className="relative p-6 bg-site-surface min-h-[340px] flex items-center justify-center">
              {/* Simulated Page in background */}
              <div className="w-full opacity-40 select-none pointer-events-none space-y-3">
                <div className="h-6 w-1/3 bg-site-surface-2 rounded" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 bg-site-surface-2 rounded" />
                  <div className="h-20 bg-site-surface-2 rounded" />
                  <div className="h-20 bg-site-surface-2 rounded" />
                </div>
                <div className="h-24 bg-site-surface-2 rounded" />
              </div>

              {/* BugSnap Extension Popup UI in Foreground */}
              <div className="absolute top-4 right-4 w-72 rounded-xl border border-site-border bg-site-surface shadow-2xl p-4 text-site-text font-site space-y-3">
                {/* Popup Header */}
                <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon.svg" alt="" aria-hidden="true" className="w-5 h-5" />
                    <span className="text-xs font-bold">BugSnap Recorder</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Drive Ready
                  </span>
                </div>

                {/* Primary Mode Selector */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <button
                    type="button"
                    className="p-2.5 rounded-lg border-2 border-accent bg-accent/10 text-site-text text-left"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Video</span>
                    </div>
                    <div className="text-[10px] text-site-text-2 mt-0.5">Ctrl+Shift+F</div>
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-lg border border-site-border bg-site-surface-2 text-site-text text-left hover:bg-site-surface transition-colors"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>📷</span>
                      <span>Screenshot</span>
                    </div>
                    <div className="text-[10px] text-site-text-2 mt-0.5">Ctrl+Shift+S</div>
                  </button>
                </div>

                {/* Telemetry Checkboxes */}
                <div className="space-y-1.5 pt-1 text-[11px] text-site-text">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked readOnly className="rounded text-accent" />
                    <span>Include DevTools console logs</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked readOnly className="rounded text-accent" />
                    <span>Attach failed network requests</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked readOnly className="rounded text-accent" />
                    <span>Record microphone audio</span>
                  </label>
                </div>

                {/* Start Button */}
                <div className="pt-2">
                  <div className="w-full py-2 rounded-lg bg-gradient-to-r from-accent via-emerald-400 to-accent text-slate-950 text-xs font-bold text-center shadow-xs">
                    Start Recording
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => (
            <Reveal key={cap.title} delay={i * 0.1}>
              <div className="relative overflow-hidden group p-6 rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 space-y-3 shadow-xs h-full transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5">
                {/* Top Edge Gradient Accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-emerald-500/10 border border-accent/30 flex items-center justify-center text-accent shadow-xs group-hover:scale-105 transition-all">
                    {cap.icon}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-site-text-2 bg-site-surface-2 px-2.5 py-1 rounded-md border border-site-border-subtle">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-site-text tracking-tight group-hover:text-accent transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Install CTA Section */}
        <Reveal delay={0.15}>
          <div className="relative overflow-hidden rounded-2xl border border-site-border bg-site-surface/85 backdrop-blur-md p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-lg">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-site-border bg-site-surface-2 text-xs text-site-text-2">
                <span>Free Forever</span>
                <span>•</span>
                <span>No Credit Card</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-site-text tracking-tight">
                Install BugSnap in one click
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                {t("extension.installMeta")}
              </p>

              <div className="pt-2">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 text-xs font-semibold shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
                  <span>{t("extension.installCta")}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
