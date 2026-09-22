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
            <div
              key={i}
              className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
                    {h.icon}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <IconCheck size={11} strokeWidth={2.5} />
                    {t("security.verifiedBadge")}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-site-text">
                  {h.title}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {h.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Data Storage Comparison Banner */}
        <div className="border border-site-border bg-site-surface-2 rounded-xl p-6 flex items-start gap-4 shadow-xs">
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

        {/* Bottom CTA Box */}
        <div className="rounded-xl border border-site-border bg-site-surface p-8 text-center space-y-4 shadow-xs">
          <h3 className="text-xl font-bold text-site-text">{t("security.ctaTitle")}</h3>
          <p className="text-xs text-site-text-2 max-w-md mx-auto leading-relaxed">
            {t("security.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 hover:text-white text-xs font-semibold px-5 py-2.5 transition-colors shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>{t("security.installFree")}</span>
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold px-5 py-2.5 transition-colors"
            >
              {t("security.seePricing")}
            </Link>
          </div>
          <div className="pt-2">
            <Link href="/privacy" className="inline-flex items-center text-xs font-medium text-site-text-2 hover:text-site-text transition-colors">
              {t("security.readPrivacy")} →
            </Link>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
