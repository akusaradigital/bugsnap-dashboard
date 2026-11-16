"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

export function WelcomeContent() {
  const { t } = useT();
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  const modKey = isMac ? "⌘" : "Ctrl";

  const triggerTestCapture = () => {
    window.postMessage(
      { source: "bugsnap-web", action: "trigger_capture", mode: "area" },
      window.location.origin
    );
  };

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-5 py-3 min-h-[44px] rounded-xl transition-all shadow-sm active:scale-[0.99] touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]";
  const secondaryBtn =
    "inline-flex items-center justify-center gap-2 border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-semibold px-5 py-3 min-h-[44px] rounded-xl transition-colors touch-manipulation shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]";
  const stepCard =
    "rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 flex flex-col justify-between shadow-xs min-w-0";
  const stepNum =
    "inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/20";
  const hintBox =
    "rounded-xl border border-site-border/70 bg-site-surface-2/60 p-2.5 text-center flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Hero */}
          <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
            <div className="space-y-5 min-w-0">
              <nav
                className="inline-flex items-center gap-1.5 text-xs text-site-text-2"
                aria-label={t("sharedFx.breadcrumb")}
              >
                <Link href="/" className="hover:text-site-text transition-colors">
                  {t("landing.home")}
                </Link>
                <span className="text-site-text-2/60" aria-hidden="true">&gt;</span>
                <span className="text-site-text font-medium">{t("welcome.breadcrumb")}</span>
              </nav>

              <h1 className="text-[clamp(1.875rem,3.6vw,3.5rem)] whitespace-nowrap font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {t("welcome.title")}
              </h1>

              <p className="text-sm sm:text-base text-site-text-2 leading-relaxed max-w-xl">
                {t("welcome.subtitle")}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button type="button" onClick={triggerTestCapture} className={`${primaryBtn} w-full sm:w-auto`}>
                  <Icon icon="lucide:play" className="w-4 h-4 shrink-0 invert" aria-hidden="true" />
                  <span>{t("welcome.testCaptureBtn")}</span>
                </button>
                <Link href="/dashboard" className={`${secondaryBtn} w-full sm:w-auto`}>
                  <span>{t("welcome.goDashboard")}</span>
                  <Icon icon="lucide:arrow-right" className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>

              <ul className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-site-text-2">
                {[t("welcome.trustFree"), t("welcome.trustDrive"), t("welcome.trustDevtools")].map((label) => (
                  <li key={label} className="flex items-center gap-2">
                    <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-[#89BD49] shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero illustration: browser window, camera, cursor, Drive badge */}
            <div className="relative min-w-0 mx-auto w-full max-w-[560px]" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/welcome-hero.svg"
                alt=""
                width={560}
                height={420}
                className="w-full h-auto dark:opacity-90"
              />
              <span className="absolute right-[4%] top-[2%] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-site-surface border border-site-border shadow-lg flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/google-drive.svg" alt="" width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8" />
              </span>
            </div>
          </section>

          {/* 3 steps */}
          <section className="space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#5B8C2A] dark:text-[#A8D666]">
                {t("welcome.setupLabel")}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
                {t("welcome.setupHeading")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className={stepCard}>
                <div className="space-y-4">
                  <span className={stepNum}>1</span>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:pin" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <h3 className="text-base sm:text-lg font-bold text-site-text">{t("welcome.step1Title")}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                    {t("welcome.step1Pre")}{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-site-text">
                      <Icon icon="lucide:puzzle" className="w-3.5 h-3.5" aria-hidden="true" />
                      {t("welcome.step1Puzzle")}
                    </span>{" "}
                    {t("welcome.step1Mid")}{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-site-text">
                      <Icon icon="lucide:pin" className="w-3.5 h-3.5" aria-hidden="true" />
                      {t("welcome.step1Pin")}
                    </span>{" "}
                    {t("welcome.step1Post")}
                  </p>
                </div>
                <div className="pt-6">
                  <div className={hintBox}>
                    <Icon icon="lucide:puzzle" className="w-4 h-4 text-site-text" aria-hidden="true" />
                    <span className="text-xs font-medium text-site-text">{t("welcome.step1Hint")}</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={stepCard}>
                <div className="space-y-4">
                  <span className={stepNum}>2</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/google-drive.svg" alt="" width={20} height={20} className="w-5 h-5" />
                    <h3 className="text-base sm:text-lg font-bold text-site-text">{t("welcome.step2Title")}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">{t("welcome.step2Desc")}</p>
                </div>
                <div className="pt-6">
                  <div className={hintBox}>
                    <Icon icon="lucide:folder" className="w-4 h-4 text-site-text" aria-hidden="true" />
                    <span className="text-xs font-medium text-site-text">{t("welcome.step2Hint")}</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className={stepCard}>
                <div className="space-y-4">
                  <span className={stepNum}>3</span>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:zap" className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                    <h3 className="text-base sm:text-lg font-bold text-site-text">{t("welcome.step3Title")}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">{t("welcome.step3Desc")}</p>
                </div>
                <div className="pt-6 space-y-2">
                  <div className="rounded-xl border border-site-border/70 bg-site-surface-2/60 p-2.5 text-xs divide-y divide-site-border/70">
                    <div className="flex items-center justify-between gap-2 py-1.5 text-site-text-2">
                      <span>{t("welcome.areaSnap")}</span>
                      <kbd className="font-mono font-semibold whitespace-nowrap px-2 py-0.5 rounded border border-site-border bg-site-surface text-blue-600 dark:text-blue-400">
                        {modKey} + Shift + S
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1.5 text-site-text-2">
                      <span>{t("welcome.recordVideo")}</span>
                      <kbd className="font-mono font-semibold whitespace-nowrap px-2 py-0.5 rounded border border-site-border bg-site-surface text-blue-600 dark:text-blue-400">
                        {modKey} + Shift + F
                      </kbd>
                    </div>
                  </div>
                  <p className="text-[11px] text-site-text-2/80 leading-relaxed">
                    {t("welcome.step3CustomShortcuts")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Automated telemetry */}
          <section className="rounded-2xl bg-site-surface-2/60 border border-site-border p-5 sm:p-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {t("welcome.telemetryLabel")}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
                {t("welcome.previewHeading")}
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2">{t("welcome.previewSub")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "lucide:code-2", tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400", title: t("welcome.previewConsoleTitle"), desc: t("welcome.previewConsoleDesc") },
                { icon: "lucide:activity", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", title: t("welcome.previewNetworkTitle"), desc: t("welcome.previewNetworkDesc") },
                { icon: "lucide:monitor", tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400", title: t("welcome.previewSystemTitle"), desc: t("welcome.previewSystemDesc") },
              ].map((card) => (
                <div key={card.title} className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-5 space-y-2 shadow-2xs min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.tone}`}>
                    <Icon icon={card.icon} className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-site-text">{card.title}</h3>
                  <p className="text-xs text-site-text-2 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Ready panel */}
          <section className="relative overflow-hidden rounded-2xl border border-site-border bg-site-surface-2/60 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
              <div className="flex items-center gap-5 min-w-0 flex-1">
                <span className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon icon="lucide:camera" className="w-7 h-7" aria-hidden="true" />
                </span>
                <div className="space-y-3 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-site-text">{t("welcome.readyTitle")}</h3>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">{t("welcome.readyDesc")}</p>
                  <div className="pt-1 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={triggerTestCapture} className={`${primaryBtn} w-full sm:w-auto`}>
                      <Icon icon="lucide:zap" className="w-4 h-4 shrink-0 invert" aria-hidden="true" />
                      <span>{t("welcome.testCapture", { key: modKey })}</span>
                    </button>
                    <Link href="/dashboard" className={`${secondaryBtn} w-full sm:w-auto`}>
                      <span>{t("welcome.goDashboard")}</span>
                      <Icon icon="lucide:arrow-right" className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/welcome-ready.svg"
                alt=""
                aria-hidden="true"
                width={320}
                height={220}
                className="hidden md:block w-64 h-auto shrink-0 mr-4"
              />
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
