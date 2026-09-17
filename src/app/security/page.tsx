"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export default function SecurityPage() {
  const { t } = useT();

  const highlights = [
    {
      gradient: "from-emerald-500 to-teal-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      ),
      title: t("security.h1Title"),
      desc: t("security.h1Desc"),
    },
    {
      gradient: "from-[#89BD49] to-[#6B9A35]",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ),
      title: t("security.h2Title"),
      desc: t("security.h2Desc"),
    },
    {
      gradient: "from-rose-500 to-pink-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: t("security.h3Title"),
      desc: t("security.h3Desc"),
    },
    {
      gradient: "from-amber-400 to-orange-500",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: t("security.h4Title"),
      desc: t("security.h4Desc"),
    },
    {
      gradient: "from-slate-500 to-slate-700",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
      title: t("security.h5Title"),
      desc: t("security.h5Desc"),
    },
    {
      gradient: "from-teal-500 to-emerald-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
      title: t("security.h6Title"),
      desc: t("security.h6Desc"),
    },
  ];

  return (
    <StaticShell
      title={t("security.title")}
      subtitle={t("security.subtitle")}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-12 space-y-8 sm:space-y-10">
        {/* Security Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-5 sm:p-6 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm space-y-3 hover:-translate-y-1 hover:shadow-xl hover:border-[#89BD49]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${h.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {h.icon}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3.5 8.5l3 3 6-6" />
                    </svg>
                    {t("security.verifiedBadge")}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                  {h.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {h.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Data Storage Comparison Banner */}
        <div className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-5 sm:p-7 flex items-start gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground">{t("security.comparisonTitle")}</h3>
            <p className="text-xs text-muted leading-relaxed max-w-3xl">
              {t("security.comparisonDesc")}
            </p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed max-w-3xl pt-1">
              {t("security.deleteNote")}
            </p>
          </div>
        </div>

        {/* Bottom CTA Box */}
        <div className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-6 sm:p-8 text-center space-y-4 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm">
          <h3 className="text-xl font-bold text-foreground">{t("security.ctaTitle")}</h3>
          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
            {t("security.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] text-white text-sm font-semibold px-6 py-2.5 transition-all shadow-sm hover:shadow-md active:scale-95 shadow-[#89BD49]/25"
            >
              {t("security.installFree")}
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-xl border border-border bg-white dark:bg-subtle hover:bg-subtle dark:hover:bg-border/30 text-foreground text-sm font-semibold px-6 py-2.5 transition-all"
            >
              {t("security.seePricing")}
            </Link>
          </div>
          <div className="pt-2">
            <Link href="/privacy" className="inline-flex items-center text-xs font-semibold text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors">
              {t("security.readPrivacy")}
            </Link>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
