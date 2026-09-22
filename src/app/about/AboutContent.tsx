"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { IconLock, IconWorld } from "@/components/site/TablerIcons";

export function AboutContent() {
  const { t } = useT();

  const stats = [
    { value: t("about.stat1Value"), label: t("about.stat1Label") },
    { value: t("about.stat2Value"), label: t("about.stat2Label") },
    { value: t("about.stat3Value"), label: t("about.stat3Label") },
    { value: t("about.stat4Value"), label: t("about.stat4Label") },
  ];

  return (
    <StaticShell title={t("about.title")} subtitle={t("about.subtitle")}>
      <div className="space-y-8 font-site">
        {/* Mission Card */}
        <div className="rounded-xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
            {t("about.missionTitle")}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-site-text">
            {t("about.headline")}
          </h2>
          <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
            {t("about.missionDesc")}
          </p>
        </div>

        {/* Stat Counter Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((st, i) => (
            <div
              key={i}
              className="rounded-xl border border-site-border bg-site-surface p-5 text-center space-y-1 shadow-xs"
            >
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-accent font-mono">
                {st.value}
              </div>
              <p className="text-xs text-site-text-2 leading-snug">
                {st.label}
              </p>
            </div>
          ))}
        </div>

        {/* 2-Column: Privacy & Ecosystem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
              <IconLock size={20} strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-site-text">
              {t("about.privacyFirstTitle")}
            </h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              {t("about.privacyFirstDesc")}
            </p>
          </div>

          <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
              <IconWorld size={20} strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-site-text">
              {t("about.ecosystemTitle")}
            </h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              {t("about.ecosystemDesc")}
            </p>
          </div>
        </div>

        {/* Company Info Box */}
        <div className="rounded-xl border border-site-border bg-site-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="text-sm font-bold text-site-text">Akusara Digital</h4>
            <p className="text-xs text-site-text-2 mt-0.5">
              {t("about.companyDesc")}
            </p>
          </div>
          <a
            href="https://akusaradigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:underline shrink-0"
          >
            {t("about.visitWebsite")} →
          </a>
        </div>
      </div>
    </StaticShell>
  );
}
