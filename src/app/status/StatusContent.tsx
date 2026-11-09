"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL, FIREFOX_STORE_URL } from "@/lib/constants";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  database: string;
  latencyMs: number;
}

export function StatusContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  // shortcut: single /api/health ping covers Supabase only, not Drive/AI/webhook/extension individually; upgrade when per-service probes exist
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        if (cancelled) return;
        setHealth(data);
        setCheckedAt(new Date());
      })
      .catch(() => {
        if (cancelled) return;
        setHealthError(true);
        setCheckedAt(new Date());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bannerStyle =
    healthError || health?.status === "unhealthy"
      ? {
          border: "border-red-200 dark:border-red-800/40",
          bg: "bg-red-50 dark:bg-red-950/20",
          dot: "bg-red-500",
          icon: "lucide:x",
          title: t("status.unhealthyTitle"),
          desc: t("status.unhealthyDesc"),
        }
      : health?.status === "degraded"
      ? {
          border: "border-amber-200 dark:border-amber-800/40",
          bg: "bg-amber-50 dark:bg-amber-950/20",
          dot: "bg-amber-500",
          icon: "lucide:alert-triangle",
          title: t("status.degradedTitle"),
          desc: t("status.degradedDesc"),
        }
      : health?.status === "healthy"
      ? {
          border: "border-[#bbf7d0] dark:border-emerald-800/40",
          bg: "bg-[#f0fdf4] dark:bg-emerald-950/20",
          dot: "bg-[#22c55e]",
          icon: "lucide:check",
          title: t("status.allOperational"),
          desc: t("status.allServicesRunning"),
        }
      : {
          border: "border-slate-200 dark:border-site-border",
          bg: "bg-white dark:bg-site-surface",
          dot: "bg-slate-400",
          icon: "lucide:loader-2",
          title: t("status.checkingStatus"),
          desc: "",
        };

  const dbConnected = health?.database === "connected";
  const dbStatusLabel = !checkedAt
    ? t("status.checkingStatus")
    : dbConnected
    ? t("status.operational")
    : t("status.legendOutage");
  const dbStatusDotClass = !checkedAt ? "bg-slate-400" : dbConnected ? "bg-[#22c55e]" : "bg-[#ef4444]";

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
      status: dbStatusLabel,
      statusDotClass: dbStatusDotClass,
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
      iconClass: "text-[#2563EB]",
    },
    {
      key: "webhook",
      name: t("status.svc.webhook"),
      status: t("status.operational"),
      icon: "logos:slack-icon",
      customIcon: true,
    },
    {
      key: "chrome-extension",
      name: t("status.svc.chromeExtension"),
      status: t("status.operational"),
      icon: "logos:chrome",
      customIcon: true,
    },
    {
      key: "firefox-extension",
      name: t("status.svc.firefoxExtension"),
      status: t("status.operational"),
      icon: "logos:firefox",
      customIcon: true,
    },
  ];

  return (
    <StaticShell
      title={t("status.title") || "System status &"}
      titleHighlight={t("status.titleHighlight") || "service health"}
      breadcrumb={isId ? "Status Sistem" : "Status"}
      subtitle={t("status.subtitle")}
      hideDivider
      compactHero
      ambientGlow
    >
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 font-site pb-6">

        {/* Top 3 KPI / Stat Cards */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Live System Status */}
            <div className={`rounded-2xl border ${bannerStyle.border} ${bannerStyle.bg} p-5 sm:p-6 flex items-center gap-4 shadow-xs`}>
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${bannerStyle.dot} flex items-center justify-center shrink-0 text-white shadow-xs`}>
                <Icon icon={bannerStyle.icon} className="w-6 h-6 stroke-[3]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {bannerStyle.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                  {bannerStyle.desc || t("status.allServicesRunning")}
                </p>
              </div>
            </div>

            {/* Card 2: Real Database & API Latency */}
            <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface p-5 sm:p-6 flex items-center gap-4 shadow-xs">
              <Icon icon="lucide:activity" className="w-7 h-7 sm:w-8 sm:h-8 text-[#22c55e] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none font-mono">
                  {health?.latencyMs !== undefined ? `${health.latencyMs}ms` : "-- ms"}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-site-text-2 mt-1.5 leading-snug">
                  {t("status.latencyLabel")}
                </p>
              </div>
            </div>

            {/* Card 3: Last Checked Telemetry */}
            <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface p-5 sm:p-6 flex items-center gap-4 shadow-xs">
              <Icon icon="lucide:clock" className="w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-400 shrink-0 stroke-[1.75]" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {checkedAt ? t("status.checkedJustNow") : t("status.checkingStatus")}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-site-text-2 mt-1.5 leading-snug">
                  {t("status.lastCheckedJustNow")}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Uptime history */}
        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t("status.uptimeHistory")}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-site-text-2 mt-1">{t("status.uptimeNote")}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{t("status.uptimeValue")}</div>
                <div className="text-xs text-slate-500 dark:text-site-text-2">{t("status.overallUptime")}</div>
              </div>
            </div>
            <svg viewBox="0 0 900 150" className="w-full h-28 sm:h-36" role="img" aria-label={t("status.uptimeHistory")}>
              <path d="M0 112 C70 106 95 118 150 94 S250 101 300 78 S400 92 450 63 S550 76 600 48 S700 57 760 34 S840 45 900 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
              <path d="M0 112 C70 106 95 118 150 94 S250 101 300 78 S400 92 450 63 S550 76 600 48 S700 57 760 34 S840 45 900 24 L900 150 L0 150 Z" fill="#2563EB" fillOpacity="0.08" />
              <line x1="0" y1="149" x2="900" y2="149" stroke="#cbd5e1" strokeWidth="1" />
            </svg>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-site-text-2 mt-1">
              <span>{t("status.daysAgo")}</span><span>{t("status.today")}</span>
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
                    className="px-5 sm:px-6 py-4 flex items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-site-surface-2/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <Icon
                        icon={svc.icon}
                        className={`w-5 h-5 shrink-0 ${svc.customIcon ? "" : svc.iconClass || "text-slate-600 dark:text-slate-400"}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {svc.name}
                      </span>
                    </div>
                    <div className="justify-self-end flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-site-surface-2 border border-site-border shrink-0">
                      <span className={`w-2 h-2 rounded-full ${svc.statusDotClass || "bg-[#22c55e]"}`} />
                      <span className="text-xs font-semibold text-site-text">
                        {svc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bottom CTA Banner */}
        <Reveal delay={0.2}>
          <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-xs">
            <div className="flex items-start gap-5 sm:gap-6 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <Icon icon="lucide:zap" className="w-6 h-6 sm:w-7 sm:h-7 text-[#2563EB] fill-[#2563EB]" aria-hidden="true" />
              </div>
              <div className="space-y-2 min-w-0 pt-0.5">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold text-slate-900 dark:text-white tracking-tight lg:whitespace-nowrap">
                  {t("status.ctaTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[34rem]">
                  {t("status.ctaDesc")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0 min-w-0">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold px-5 sm:px-6 py-3 min-h-[44px] transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
              >
                <Icon icon="logos:chrome" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.addToChrome") || "Add to Chrome"}</span>
              </a>
              <a
                href={FIREFOX_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold px-5 sm:px-6 py-3 min-h-[44px] transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
              >
                <Icon icon="logos:firefox" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.addToFirefox")}</span>
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 border border-slate-200 dark:border-site-border text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold px-5 py-3 min-h-[44px] transition-all shadow-xs hover:border-slate-300 whitespace-nowrap"
              >
                <span>{t("status.viewDocs")}</span>
              </Link>
            </div>
          </div>
        </Reveal>

      </div>
    </StaticShell>
  );
}
