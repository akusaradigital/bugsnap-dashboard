"use client";

import { useState } from "react";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { DevToolsCard, GoogleDriveProofCard } from "@/components/site/ProductMockups";
import { IconCheck } from "@/components/site/TablerIcons";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

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
      <div className="space-y-12">
        {/* Category selector / filter tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  isActive
                    ? "border-accent bg-accent text-slate-900 shadow-2xs"
                    : "border-site-border bg-site-surface text-site-text-2 hover:text-site-text hover:bg-site-surface-2"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          {/* Feature 1: Instant Capture */}
          {showCapture && (
            <div className="rounded-xl border border-site-border bg-site-surface p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  {t("features.f1Eyebrow")}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-site-text">
                  {t("features.f1Title")}
                </h2>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("features.f1Desc")}
                </p>
                <ul className="space-y-1.5 text-xs text-site-text pt-2">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>{t("features.f1HotkeyScreen")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>{t("features.f1HotkeyVideo")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>{t("features.f1Editor")}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-site-border bg-site-surface-2 p-4 space-y-3 font-mono text-xs text-site-text">
                <div className="flex items-center justify-between border-b border-site-border-subtle pb-2">
                  <span className="font-bold text-site-text">{t("landing.screenRecorder")}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">REC 00:42</span>
                </div>
                <div className="aspect-video bg-site-surface border border-site-border-subtle rounded-md flex items-center justify-center text-site-text-2 text-xs">
                  {t("features.f1Stream")}
                </div>
              </div>
            </div>
          )}

          {/* Feature 2: DevTools Capture */}
          {showDevTools && (
            <div className="rounded-xl border border-site-border bg-site-surface p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xs">
              <div className="order-2 md:order-1">
                <DevToolsCard />
              </div>
              <div className="order-1 md:order-2 space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  {t("features.f2Eyebrow")}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-site-text">
                  {t("features.f2Title")}
                </h2>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("features.f2Desc")}
                </p>
              </div>
            </div>
          )}

          {/* Feature 3: Drive Storage & Web Dashboard */}
          {showStorage && (
            <div className="rounded-xl border border-site-border bg-site-surface p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  {t("features.f3Eyebrow")}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-site-text">
                  {t("features.f3Title")}
                </h2>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("features.f3Desc")}
                </p>
              </div>
              <div>
                <GoogleDriveProofCard />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-site-border bg-site-surface p-8 text-center space-y-4 shadow-xs">
          <h3 className="text-xl font-bold text-site-text">
            {t("features.ctaTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-site-text-2 max-w-md mx-auto leading-relaxed">
            {t("features.ctaDesc")}
          </p>
          <div className="pt-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-slate-900 hover:bg-accent-hover hover:text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>{t("features.ctaButton")}</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
