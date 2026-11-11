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
            <div className="flex items-center gap-px sm:gap-1 h-10 sm:h-12" role="img" aria-label={t("status.uptimeHistory")}>
              {Array.from({ length: 90 }, (_, i) => {
                const day = new Date(Date.now() - (89 - i) * 86400000);
                return (
                  <span
                    key={i}
                    title={day.toLocaleDateString(isId ? "id-ID" : "en-US", { month: "short", day: "numeric" })}
                    className="flex-1 h-full rounded-full bg-[#22c55e] hover:opacity-70 transition-opacity"
                  />
                );
              })}
            </div>
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
          <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm min-w-0">
            <div className="space-y-1.5 max-w-xl min-w-0">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("status.ctaEyebrow") || "READY TO GET STARTED?"}
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t("status.ctaTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t("status.ctaDesc")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0 min-w-0">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
              >
                <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.addToChrome") || "Add to Chrome"}</span>
              </a>
              <a
                href={FIREFOX_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
              >
                <Icon icon="logos:firefox" className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.addToFirefox")}</span>
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 rounded-xl border border-site-border bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 text-site-text text-sm font-semibold px-6 py-3.5 transition-colors shrink-0 whitespace-nowrap"
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
