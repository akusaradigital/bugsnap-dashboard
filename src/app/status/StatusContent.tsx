"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL } from "@/lib/constants";

export function StatusContent() {
  const { t } = useT();

  const services = [
    {
      key: "dashboard",
      name: t("status.svc.dashboard"),
      status: t("status.operational"),
      icon: "lucide:layout-grid",
      iconClass: "text-slate-600 dark:text-slate-400",
    },
    {
      key: "api",
      name: t("status.svc.api"),
      status: t("status.operational"),
      icon: "lucide:database",
      iconClass: "text-slate-600 dark:text-slate-400",
    },
    {
      key: "drive",
      name: t("status.svc.drive"),
      status: t("status.operational"),
      icon: "logos:google-drive",
      customIcon: true,
    },
    {
      key: "ai",
      name: t("status.svc.ai"),
      status: t("status.operational"),
      icon: "lucide:sparkles",
      iconClass: "text-purple-500",
    },
    {
      key: "webhook",
      name: t("status.svc.webhook"),
      status: t("status.operational"),
      icon: "logos:slack-icon",
      customIcon: true,
    },
    {
      key: "extension",
      name: t("status.svc.extension"),
      status: t("status.operational"),
      icon: "lucide:puzzle",
      iconClass: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <StaticShell
      title={t("status.title")}
      subtitle={t("status.subtitle")}
      hideDivider
      compactHero
      ambientGlow
    >
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 font-site pb-6">

        {/* Top 3 KPI / Stat Cards */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: All Systems Operational */}
            <div className="rounded-2xl border border-[#bbf7d0] dark:border-emerald-800/40 bg-[#f0fdf4] dark:bg-emerald-950/20 p-5 sm:p-6 flex items-center gap-4 shadow-xs">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0 text-white shadow-xs">
                <Icon icon="lucide:check" className="w-6 h-6 stroke-[3]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {t("status.allOperational")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                  {t("status.allServicesRunning")}
                </p>
              </div>
            </div>

            {/* Card 2: 99.98% Uptime */}
            <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface p-5 sm:p-6 flex items-center gap-4 shadow-xs">
              <Icon icon="custom:chart-bars" className="w-7 h-7 sm:w-8 sm:h-8 text-[#22c55e] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none font-mono">
                  {t("status.uptimeValue")}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-site-text-2 mt-1.5 leading-snug">
                  {t("status.overallUptime")}
                </p>
              </div>
            </div>

            {/* Card 3: < 1 min Last Checked */}
            <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface p-5 sm:p-6 flex items-center gap-4 shadow-xs">
              <Icon icon="lucide:clock" className="w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-400 shrink-0 stroke-[1.75]" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {t("status.lastChecked")}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-site-text-2 mt-1.5 leading-snug">
                  {t("status.lastCheckedJustNow")}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Service Components Breakdown */}
        <Reveal delay={0.1}>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {t("status.components")}
              </h2>
              <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                  <span>{t("status.legendOperational")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                  <span>{t("status.legendDegraded")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span>{t("status.legendOutage")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-site-border-subtle">
                {services.map((svc) => (
                  <div
                    key={svc.key}
                    className="px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-site-surface-2/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <Icon
                        icon={svc.icon}
                        className={`w-5 h-5 shrink-0 ${svc.customIcon ? "" : svc.iconClass || "text-slate-600 dark:text-slate-400"}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {svc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0fdf4] dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/30 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {svc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Uptime History Bar Card */}
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {t("status.uptimeHistory")}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                {t("status.uptimeValue")}
              </span>
            </div>
            <div className="flex gap-1 sm:gap-1.5 h-6 sm:h-7 items-stretch">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-xs sm:rounded-sm bg-[#10b981] hover:bg-[#059669] transition-colors cursor-pointer"
                  title={`Day ${i + 1}: 100% Operational`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-site-text-2 font-medium">
              <span>{t("status.daysAgo")}</span>
              <span>{t("status.today")}</span>
            </div>
          </div>
        </Reveal>

        {/* Bottom CTA Banner */}
        <Reveal delay={0.2}>
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-200/90 dark:border-emerald-800/40 bg-[#f0fdf4] dark:bg-emerald-950/20 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                <Icon icon="lucide:zap" className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 fill-emerald-500" aria-hidden="true" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t("status.ctaTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("status.ctaDesc")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-slate-900 text-xs sm:text-sm font-bold px-5 sm:px-6 py-3 min-h-[44px] transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
              >
                <Icon icon="logos:chrome" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
                <span>{t("status.installFree")}</span>
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 border border-slate-200 dark:border-site-border text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold px-5 py-3 min-h-[44px] transition-all shadow-xs hover:border-slate-300 whitespace-nowrap"
              >
                <span>{t("status.viewPricing")}</span>
                <Icon icon="lucide:arrow-right" className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>

      </div>
    </StaticShell>
  );
}
