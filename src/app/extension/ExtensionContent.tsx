"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { BrowserFrame } from "@/components/site/BrowserFrame";
import { IconCamera, IconWorld, IconDatabase } from "@/components/site/TablerIcons";

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
        {/* Hero Product Visual: Extension inside BrowserFrame */}
        <div className="max-w-3xl mx-auto">
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
                  <div className="w-full py-2 rounded-lg bg-accent text-slate-900 text-xs font-bold text-center shadow-xs">
                    Start Recording
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="p-6 rounded-xl border border-site-border bg-site-surface space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-site-surface-2 border border-site-border-subtle">
                  {cap.icon}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-site-text-2 bg-site-surface-2 px-2 py-0.5 rounded">
                  {cap.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-site-text tracking-tight">
                {cap.title}
              </h3>
              <p className="text-xs text-site-text-2 leading-relaxed">
                {cap.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Install CTA Section */}
        <div className="rounded-xl border border-site-border bg-site-surface p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-site-border bg-site-surface-2 text-xs text-site-text-2">
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

          <div className="pt-4">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-slate-900 text-sm font-semibold hover:bg-accent-hover hover:text-white transition-all shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
              <span>{t("extension.installCta")}</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
