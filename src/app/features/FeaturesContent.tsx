"use client";

import { useState } from "react";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

type FeatureCategory = "all" | "capture" | "devtools" | "storage";

export function FeaturesContent() {
  const { t } = useT();
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>("all");

  const categories: { id: FeatureCategory; label: string }[] = [
    { id: "all", label: t("features.catAll") },
    { id: "capture", label: t("features.catCapture") },
    { id: "devtools", label: t("features.catDevTools") },
    { id: "storage", label: t("features.catStorage") },
  ];

  const showCapture = activeCategory === "all" || activeCategory === "capture";
  const showDevTools = activeCategory === "all" || activeCategory === "devtools";
  const showStorage = activeCategory === "all" || activeCategory === "storage";

  return (
    <StaticShell
      title={t("features.title")}
      subtitle={t("features.subtitle")}
    >
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-12">
        {/* Category selector / filter pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                    : "bg-white/80 dark:bg-subtle text-muted hover:text-foreground border border-border/70 hover:border-indigo-500/40 hover:-translate-y-0.5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Features Bento Grid */}
        <div className="space-y-12">
          {/* Feature 1: Instant Capture */}
          {showCapture && (
            <div className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-6 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t("features.f1Eyebrow")}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t("features.f1Title")}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {t("features.f1Desc")}
                </p>
                <ul className="space-y-1.5 text-xs text-muted pt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("features.f1HotkeyScreen")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("features.f1HotkeyVideo")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("features.f1Editor")}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-border/70 bg-slate-50/80 dark:bg-subtle/75 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <span className="text-xs font-bold text-foreground">{t("landing.screenRecorder")}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-mono font-semibold">REC 00:42</span>
                </div>
                <div className="aspect-video bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-medium shadow-inner">
                  {t("features.f1Stream")}
                </div>
              </div>
            </div>
          )}

          {/* Feature 2: DevTools Capture */}
          {showDevTools && (
            <div className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-6 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 rounded-xl border border-border/70 bg-slate-50/80 dark:bg-subtle/75 p-4 font-mono text-[11px] space-y-2.5">
                <div className="text-muted text-[10px] uppercase font-sans font-semibold border-b border-border/60 pb-1.5">
                  {t("features.devLogsTitle")}
                </div>
                <div className="text-red-600 bg-red-50/80 dark:bg-red-950/30 dark:text-red-400 p-2.5 rounded-lg border border-red-200/50 dark:border-red-900/40">
                  {t("features.devLogsError")}
                </div>
                <div className="text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                  {t("features.devLogsWarn")}
                </div>
                <div className="text-[10px] font-sans text-muted pt-1">
                  {t("features.devLogsEnv")}
                </div>
              </div>
              <div className="order-1 md:order-2 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t("features.f2Eyebrow")}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t("features.f2Title")}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {t("features.f2Desc")}
                </p>
              </div>
            </div>
          )}

          {/* Feature 3: Drive Storage & Web Dashboard */}
          {showStorage && (
            <div className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-6 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t("features.f3Eyebrow")}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t("features.f3Title")}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {t("features.f3Desc")}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-white/60 dark:bg-subtle/75 p-6 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mx-auto flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-emerald-500/25 transition-all duration-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {t("features.f3BadgeTitle")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {t("features.f3BadgeDesc")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-8 text-center space-y-4 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-foreground">
            {t("features.ctaTitle")}
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
            {t("features.ctaDesc")}
          </p>
          <div className="pt-2">
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="Chrome" className="w-4 h-4 shrink-0" />
              <span>{t("features.ctaButton")}</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
