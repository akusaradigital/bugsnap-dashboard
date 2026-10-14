"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import {
  IconFolder,
  IconLock,
  IconShieldCheck,
  IconDatabase,
  IconCheck,
} from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SecurityContent() {
  const { t } = useT();

  const highlights = [
    {
      icon: <IconFolder size={18} strokeWidth={2} />,
      title: t("security.h1Title"),
      desc: t("security.h1Desc"),
    },
    {
      icon: <IconLock size={18} strokeWidth={2} />,
      title: t("security.h2Title"),
      desc: t("security.h2Desc"),
    },
    {
      icon: <IconShieldCheck size={18} strokeWidth={2} />,
      title: t("security.h3Title"),
      desc: t("security.h3Desc"),
    },
    {
      icon: <IconShieldCheck size={18} strokeWidth={2} />,
      title: t("security.h4Title"),
      desc: t("security.h4Desc"),
    },
    {
      icon: <IconDatabase size={18} strokeWidth={2} />,
      title: t("security.h5Title"),
      desc: t("security.h5Desc"),
    },
    {
      icon: <IconCheck size={18} strokeWidth={2} />,
      title: t("security.h6Title"),
      desc: t("security.h6Desc"),
    },
  ];

  return (
    <StaticShell
      title={t("security.title")}
      subtitle={t("security.subtitle")}
    >
      <div className="space-y-8 font-site">
        {/* Security Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <Reveal key={i} delay={i * 0.08} className="h-full">
              <div className="group h-full rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-site-border-focus hover:shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center group-hover:border-accent/40 group-hover:bg-accent/5 transition-colors">
                      {h.icon}
                    </div>
                    <Reveal delay={i * 0.08 + 0.05} y={4} className="inline-flex">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <IconCheck size={11} strokeWidth={2.5} />
                        {t("security.verifiedBadge")}
                      </span>
                    </Reveal>
                  </div>
                  <h3 className="font-bold text-sm text-site-text">
                    {h.title}
                  </h3>
                  <p className="text-xs text-site-text-2 leading-relaxed">
                    {h.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Data Storage & Flow Comparison Banner */}
        <Reveal delay={0.2}>
          <div className="border border-site-border bg-site-surface-2 rounded-xl p-6 flex items-start gap-4 shadow-xs transition-all duration-200 hover:border-site-border-focus">
            <div className="w-10 h-10 rounded-lg bg-site-surface border border-site-border text-accent flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-site-text">{t("security.comparisonTitle")}</h3>
              <p className="text-xs text-site-text-2 leading-relaxed max-w-3xl">
                {t("security.comparisonDesc")}
              </p>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed max-w-3xl pt-1">
                {t("security.deleteNote")}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Bottom CTA Box */}
        <Reveal delay={0.25}>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface p-6 sm:p-8 lg:p-10 shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-w-0">
              <div className="space-y-1.5 text-left min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight leading-snug">
                  {t("security.ctaTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                  {t("security.ctaDesc")}
                </p>
                <div className="pt-1">
                  <Link href="/privacy" className="inline-flex items-center gap-1 text-xs font-medium text-site-text-2 hover:text-site-text transition-colors touch-manipulation">
                    <span>{t("security.readPrivacy")}</span>
                    <Icon icon="lucide:arrow-right" className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99] touch-manipulation whitespace-nowrap"
                >
                  <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t("security.installFree")}</span>
                </a>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs sm:text-sm font-semibold px-5 py-3 min-h-[44px] transition-colors touch-manipulation whitespace-nowrap"
                >
                  {t("security.seePricing")}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
