"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

const CARD = "group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-5 sm:p-6 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl hover:border-[#89BD49]/40 transition-all duration-300";

export default function AboutPage() {
  const { t } = useT();

  const stats = [
    { value: t("about.stat1Value"), label: t("about.stat1Label") },
    { value: t("about.stat2Value"), label: t("about.stat2Label") },
    { value: t("about.stat3Value"), label: t("about.stat3Label") },
    { value: t("about.stat4Value"), label: t("about.stat4Label") },
  ];

  return (
    <StaticShell title={t("about.title")} subtitle={t("about.subtitle")}>
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-10 sm:py-12 space-y-8 sm:space-y-10">
        {/* Mission Card */}
        <div className={`${CARD} sm:p-8 space-y-3`}>
          <div className="text-xs font-bold uppercase tracking-wider text-[#6B9A35] dark:text-[#A8D666]">
            {t("about.missionTitle")}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
            {t("about.headline")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-muted leading-relaxed">
            {t("about.missionDesc")}
          </p>
        </div>

        {/* Stat Counter Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((st, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-3.5 sm:p-5 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm text-center space-y-1.5 hover:-translate-y-1 hover:shadow-xl hover:border-[#89BD49]/40 transition-all duration-300"
            >
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#89BD49]">
                {st.value}
              </div>
              <p className="text-[11px] text-muted leading-snug">
                {st.label}
              </p>
            </div>
          ))}
        </div>

        {/* 2-Column: Privacy & Ecosystem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${CARD} space-y-3`}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
              {t("about.privacyFirstTitle")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-muted leading-relaxed">
              {t("about.privacyFirstDesc")}
            </p>
          </div>

          <div className={`${CARD} space-y-3`}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
              {t("about.ecosystemTitle")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-muted leading-relaxed">
              {t("about.ecosystemDesc")}
            </p>
          </div>
        </div>

        {/* Company Info Box */}
        <div className={`${CARD} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">Akusara Digital</h4>
            <p className="text-xs text-slate-600 dark:text-muted mt-0.5">
              {t("about.companyDesc")}
            </p>
          </div>
          <a
            href="https://akusaradigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors shrink-0"
          >
            {t("about.visitWebsite")}
          </a>
        </div>
      </div>
    </StaticShell>
  );
}
