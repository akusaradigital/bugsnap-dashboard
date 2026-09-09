"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export default function AboutPage() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("about.title")}
      subtitle={t("about.subtitle")}
      ctaLabel="← Home"
      ctaHref="/"
    >
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        {/* Mission Card */}
        <div className="creative-surface rounded-2xl p-6 sm:p-8 space-y-3 border border-border">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            {t("about.missionTitle")}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("about.headline")}
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            {t("about.missionDesc")}
          </p>
        </div>

        {/* 2-Column: Privacy & Ecosystem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="creative-surface rounded-2xl p-6 space-y-3 border border-border">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              🔒
            </div>
            <h3 className="text-base font-bold text-foreground">{t("about.privacyFirstTitle")}</h3>
            <p className="text-xs text-muted leading-relaxed">{t("about.privacyFirstDesc")}</p>
          </div>

          <div className="creative-surface rounded-2xl p-6 space-y-3 border border-border">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              🌐
            </div>
            <h3 className="text-base font-bold text-foreground">{t("about.ecosystemTitle")}</h3>
            <p className="text-xs text-muted leading-relaxed">{t("about.ecosystemDesc")}</p>
          </div>
        </div>

        {/* Company Info Box */}
        <div className="creative-surface rounded-2xl p-6 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-foreground">Akusara Digital</h4>
            <p className="text-xs text-muted mt-0.5">
              Creator of BugSnap, Aksora, and SnapTest AI.
            </p>
          </div>
          <a
            href="https://akusaradigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline shrink-0"
          >
            Visit akusaradigital.com →
          </a>
        </div>
      </div>
    </StaticShell>
  );
}
