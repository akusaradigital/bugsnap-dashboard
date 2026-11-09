"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SecurityContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  const highlights = [
    {
      icon: "lucide:folder",
      title: t("security.h1Title"),
      desc: t("security.h1Desc"),
    },
    {
      icon: "lucide:lock",
      title: t("security.h2Title"),
      desc: t("security.h2Desc"),
    },
    {
      icon: "lucide:shield",
      title: t("security.h3Title"),
      desc: t("security.h3Desc"),
    },
    {
      icon: "lucide:award",
      title: t("security.h4Title"),
      desc: t("security.h4Desc"),
    },
    {
      icon: "lucide:database",
      title: t("security.h5Title"),
      desc: t("security.h5Desc"),
    },
    {
      icon: "lucide:check",
      title: t("security.h6Title"),
      desc: t("security.h6Desc"),
    },
  ];

  return (
    <StaticShell
      title={t("security.title") || "Security built on"}
      titleHighlight={t("security.titleHighlight") || "trust & transparency"}
      breadcrumb={isId ? "Keamanan" : "Security"}
      subtitle={t("security.subtitle")}
      hideDivider={true}
    >
      <div className="space-y-8 sm:space-y-10 font-site">
        {/* Security Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <Reveal key={i} delay={i * 0.05} className="h-full">
              <div className="h-full rounded-2xl border border-site-border bg-site-surface p-6 sm:p-7 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-site-border-focus hover:shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <Icon
                      icon={h.icon}
                      className="w-6 h-6 text-site-text stroke-[1.75]"
                      aria-hidden="true"
                    />
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                      <Icon
                        icon="lucide:check"
                        className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]"
                        aria-hidden="true"
                      />
                      <span>{t("security.verifiedBadge")}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-[17px] text-site-text mt-5 mb-2 tracking-tight">
                    {h.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-site-text-2 leading-relaxed">
                    {h.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Architecture & Data Sovereignty Section */}
        <Reveal delay={0.15}>
          <div className="rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface-2 p-5 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("security.architectureEyebrow")}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-site-text">
                  {t("security.comparisonTitle")}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-bold self-start sm:self-auto shrink-0">
                <Icon
                  icon="lucide:check"
                  className="w-3.5 h-3.5 stroke-[2.5]"
                  aria-hidden="true"
                />
                <span>{t("security.zeroRetention")}</span>
              </span>
            </div>

            {/* Dark Vault Container */}
            <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-5 sm:p-7 text-white shadow-md space-y-6">
              {/* Header inside Vault */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Icon
                    icon="lucide:shield-check"
                    className="w-4 h-4 stroke-[2]"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="font-bold text-white">
                    {t("security.vaultTitle")}
                  </span>
                  <span className="text-slate-500 font-light">/</span>
                  <span className="font-semibold text-emerald-400">
                    {t("security.vaultSubtitle")}
                  </span>
                </div>
              </div>

              {/* 3 Stages Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                {/* Stage 1 */}
                <div className="h-full rounded-xl bg-[#1e293b]/70 border border-slate-700/60 p-5 sm:p-6 space-y-4">
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    {t("security.stage1Title")}
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage1Item1")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage1Item2")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage1Item3")}</span>
                    </li>
                  </ul>
                </div>


                {/* Stage 2 (Accent Border) */}
                <div className="h-full rounded-xl bg-[#1e293b]/90 border-2 border-emerald-500 p-5 sm:p-6 space-y-4 shadow-sm shadow-emerald-500/10">
                  <h4 className="font-bold text-sm sm:text-base text-emerald-400">
                    {t("security.stage2Title")}
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage2Item1")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage2Item2")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage2Item3")}</span>
                    </li>
                  </ul>
                </div>


                {/* Stage 3 */}
                <div className="h-full rounded-xl bg-[#1e293b]/70 border border-slate-700/60 p-5 sm:p-6 space-y-4">
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    {t("security.stage3Title")}
                  </h4>
                  <div className="flex items-center gap-3">
                    <Icon
                      icon="logos:google-drive"
                      className="w-8 h-8 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-bold text-sm text-white">
                        {t("security.companyDrive")}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-400 font-mono">
                        {t("security.aesEncrypted")}
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3 pt-1">
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage3Item1")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t("security.stage3Item2")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notes below Vault */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="flex items-start gap-2.5">
                <Icon
                  icon="lucide:check"
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  aria-hidden="true"
                />
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("security.storeMetadataNote")}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon
                  icon="lucide:check"
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  aria-hidden="true"
                />
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("security.deleteNote")}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bottom CTA Box */}
        <Reveal delay={0.2}>
          <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
                {t("security.ctaTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-xl">
                {t("security.ctaDesc")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] transition-all shadow-sm shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap touch-manipulation"
              >
                <Icon
                  icon="logos:chrome"
                  className="w-4 h-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{t("security.installFree")}</span>
              </a>
              <a
                href={FIREFOX_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] transition-all shadow-sm shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap touch-manipulation"
              >
                <Icon icon="logos:firefox" className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t("extension.addToFirefox")}</span>
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs sm:text-sm font-semibold px-5 py-3 min-h-[44px] transition-colors whitespace-nowrap touch-manipulation"
              >
                <span>{t("security.seePricing")}</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
