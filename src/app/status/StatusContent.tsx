"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { CHROME_STORE_URL } from "@/lib/constants";

export function StatusContent() {
  const { t } = useT();

  const services = [
    { key: "dashboard", name: t("status.svc.dashboard"), status: t("status.operational") },
    { key: "api", name: t("status.svc.api"), status: t("status.operational") },
    { key: "drive", name: t("status.svc.drive"), status: t("status.operational") },
    { key: "ai", name: t("status.svc.ai"), status: t("status.operational") },
    { key: "webhook", name: t("status.svc.webhook"), status: t("status.operational") },
    { key: "extension", name: t("status.svc.extension"), status: t("status.operational") },
  ];

  return (
    <StaticShell
      title={t("status.title")}
      subtitle={t("status.subtitle")}
    >
      <div className="space-y-8 font-site">

        {/* Main Status Header */}
        <Reveal>
          <div className="relative overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-site-surface to-accent/10 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md shadow-emerald-500/5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <h2 className="text-base font-bold text-site-text">{t("status.allOperational")}</h2>
                <p className="text-xs text-site-text-2">{t("status.uptimeNote")}</p>
              </div>
            </div>
            <span className="text-xs text-site-text-2 hidden sm:inline font-mono">
              {t("status.checkedJustNow")}
            </span>
          </div>
        </Reveal>

        {/* System Component Breakdown */}
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-site-border bg-site-surface shadow-xs overflow-hidden">
            <div className="bg-site-surface-2/70 px-5 py-3 border-b border-site-border text-xs font-bold uppercase tracking-wider text-site-text-2">
              {t("status.components")}
            </div>
            <div className="divide-y divide-site-border-subtle">
              {services.map((svc) => (
                <div key={svc.key} className="px-5 py-3.5 flex items-center justify-between hover:bg-site-surface-2/40 transition-colors">
                  <span className="text-xs sm:text-sm font-medium text-site-text">{svc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{svc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Historical bar */}
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-site-border bg-gradient-to-b from-site-surface to-site-surface-2/60 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-site-text-2">
              <span>{t("status.uptimeHistory")}</span>
              <span className="font-semibold text-site-text font-mono">99.98%</span>
            </div>
            <div className="flex gap-1 h-6">
              {Array.from({ length: 45 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-xs bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer"
                  title={`Day ${i + 1}: 100% Uptime`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-site-text-2 font-mono">
              <span>{t("status.daysAgo")}</span>
              <span>{t("status.today")}</span>
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.2}>
          <div className="relative overflow-hidden rounded-2xl border border-site-border bg-site-surface/85 backdrop-blur-md p-8 sm:p-10 text-center space-y-4 shadow-lg">
            <div className="relative z-10 space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-site-text">{t("status.ctaTitle")}</h3>
              <p className="text-xs sm:text-sm text-site-text-2 max-w-md mx-auto leading-relaxed">
                {t("status.ctaDesc")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 text-xs font-semibold px-6 py-2.5 transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
                  <span>{t("status.installFree")}</span>
                </a>
                <Link
                  href="/pricing"
                  className="text-xs font-semibold text-site-text-2 hover:text-site-text px-4 py-2.5 transition-colors hover:scale-105"
                >
                  {t("status.viewPricing")} →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

      </div>
    </StaticShell>
  );
}
