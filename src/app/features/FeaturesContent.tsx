"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { ShowcaseVisualCard } from "@/components/site/ShowcaseVisualCard";
import { Icon } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";
import { HERO_BREADCRUMB_CLS, HERO_SUBTITLE_CLS } from "@/lib/heroStyles";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function FeaturesContent() {
  const { t } = useT();

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-8 sm:pt-12 pb-8 sm:pb-10">
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal delay={0}>
              {/* Breadcrumb */}
              <nav
                className={HERO_BREADCRUMB_CLS}
                aria-label={t("featFx.breadcrumbLabel")}
              >
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("landing.home")}
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">/</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t("features.breadcrumb")}
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                {t("features.title")}
                <br />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t("features.titleHighlight")}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className={HERO_SUBTITLE_CLS}>
                {t("features.subtitle")}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Main Capabilities Sections */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16 space-y-10 sm:space-y-12">
          {/* SECTION 1: DEVTOOLS & TELEMETRY */}
          {(
            <Reveal delay={0.05}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left: Text Content */}
                <div className="lg:col-span-6 min-w-0 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s1Eyebrow")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t("features.s1Title")}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s1Desc")}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s1Bullet1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s1Bullet2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s1Bullet3")}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Right: DevTools & Telemetry Visual */}
                <div className="lg:col-span-6 min-w-0">
                  <ShowcaseVisualCard
                    src="/showcase/ui-devtools-telemetry.png"
                    alt="BugSnap capture viewer displaying failed HTTP 500 network payloads, redacted bearer tokens, and console stack traces"
                  />
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 2: VISUAL STUDIO */}
          {(
            <Reveal delay={0.08}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Visual Studio Editor Visual */}
                <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
                  <ShowcaseVisualCard
                    src="/showcase/ui-editor-annotations.png"
                    alt="BugSnap visual studio editor with annotation tools, PII blur, AI Polish summary, and Google Drive folder selection"
                  />
                </div>

                {/* Right: Text Content */}
                <div className="lg:col-span-6 min-w-0 order-1 lg:order-2 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s2Eyebrow")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t("features.s2Title")}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s2Desc")}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s2Bullet1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s2Bullet2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s2Bullet3")}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 3: PRIVACY & DATA CONTROL */}
          {(
            <Reveal delay={0.1}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Text Content */}
                <div className="lg:col-span-6 min-w-0 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s3Eyebrow")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t("features.s3Title")}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s3Desc")}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s3Bullet1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s3Bullet2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s3Bullet3")}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Right: Client-Side Redaction Visual */}
                <div className="lg:col-span-6 min-w-0">
                  <ShowcaseVisualCard
                    src="/showcase/ui-privacy-redaction.png"
                    alt="BugSnap client-side redaction rules masking emails, credit card numbers, bearer tokens, and API keys before saving to Google Drive"
                  />
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 4: PERFORMANCE & DIAGNOSTICS */}
          {(
            <Reveal delay={0.12}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: SPA Performance Diagnostics Visual */}
                <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
                  <ShowcaseVisualCard
                    src="/showcase/ui-spa-performance.png"
                    alt="BugSnap SPA performance monitor tracking JS heap memory growth, detached DOM nodes, event listeners, and Core Web Vitals"
                  />
                </div>

                {/* Right: Text Content */}
                <div className="lg:col-span-6 min-w-0 order-1 lg:order-2 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s4Eyebrow")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t("features.s4Title")}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s4Desc")}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s4Bullet1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s4Bullet2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s4Bullet3")}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 5: AUTOMATION & AI INTEGRATION */}
          {(
            <Reveal delay={0.14}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Text Content */}
                <div className="lg:col-span-6 min-w-0 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s5Eyebrow")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t("features.s5Title")}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s5Desc")}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s5Bullet1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s5Bullet2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s5Bullet3")}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Right: Playwright Test & AI Blueprint Visual */}
                <div className="lg:col-span-6 min-w-0">
                  <ShowcaseVisualCard
                    src="/showcase/ui-playwright-ai.png"
                    alt="BugSnap generating runnable Playwright regression tests and AI fix blueprints from captured user steps"
                  />
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 6: BOTTOM TELEMETRY SCHEMA BANNER */}
          <Reveal delay={0.16}>
            <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm min-w-0">
              <div className="space-y-1.5 max-w-xl min-w-0">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("features.ctaEyebrow")}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t("features.bannerTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t("features.bannerSubtitle")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 min-w-0">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
                >
                  <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" />
                  <span>
                    {t("extension.addToChrome")}
                  </span>
                </a>
                <a
                  href={FIREFOX_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
                >
                  <Icon icon="logos:firefox" className="w-5 h-5 shrink-0" />
                  <span>{t("extension.addToFirefox")}</span>
                </a>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-site-border bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 text-site-text text-sm font-semibold px-6 py-3.5 transition-colors shrink-0 whitespace-nowrap"
                >
                  {t("features.bannerDocsBtn")}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
