"use client";

import { HERO_BREADCRUMB_CLS, HERO_SUBTITLE_CLS } from "@/lib/heroStyles";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { ShowcaseVisualCard } from "@/components/site/ShowcaseVisualCard";
import { Icon } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SolutionsContent() {
  const { t } = useT();

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 font-site flex flex-col bg-[#fcfdfe] dark:bg-[#0b0f17]">
      <SiteNavbar />

      <main id="main-content" className="flex-1 pb-12 sm:pb-16">
        {/* Hero Section */}
        <div className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal delay={0}>
            {/* Breadcrumb */}
            <nav
              className={HERO_BREADCRUMB_CLS}
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t("landing.home")}
              </Link>
              <span className="text-slate-400 dark:text-slate-600 font-normal" aria-hidden="true">
                /
              </span>
              <span className="text-slate-900 dark:text-white font-medium">
                {t("site.nav.solutions")}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("solutions.title")}
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">
                {t("solutions.titleHighlight")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className={HERO_SUBTITLE_CLS}>
              {t("solutions.subtitle")}
            </p>
          </Reveal>
        </div>

        {/* 4 Alternating Solutions Sections */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Section 1: Quality Assurance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Text */}
            <Reveal delay={0.1} className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("solutions.qa.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.qa.role")}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.qa.desc")}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.qa.point1")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.qa.point2")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.qa.point3")}
                  </span>
                </li>
              </ul>
            </Reveal>

            {/* Right: QA Workflow Visual */}
            <Reveal delay={0.16} className="lg:col-span-6 min-w-0">
              <ShowcaseVisualCard
                src="/showcase/ui-qa-workflow.png"
                alt="BugSnap extension recording tab alongside automatic QA step timeline, voice narration, and Jira sync"
              />
            </Reveal>
          </div>

          {/* Section 2: Engineering */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Engineering DevTools Visual */}
            <Reveal
              delay={0.16}
              className="lg:col-span-6 min-w-0 order-2 lg:order-1"
            >
              <ShowcaseVisualCard
                src="/showcase/ui-devtools-telemetry.png"
                alt="BugSnap engineering debug view with HTTP 500 request headers, redacted tokens, console stack trace, and Copy cURL"
              />
            </Reveal>

            {/* Right: Text */}
            <Reveal
              delay={0.1}
              className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5 order-1 lg:order-2"
            >
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("solutions.dev.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.dev.role")}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.dev.desc")}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.dev.point1")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.dev.point2")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.dev.point3")}
                  </span>
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Section 3: Product Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Text */}
            <Reveal delay={0.1} className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("solutions.pm.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.pm.role")}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.pm.desc")}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.pm.point1")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.pm.point2")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.pm.point3")}
                  </span>
                </li>
              </ul>
            </Reveal>

            {/* Right: Product Review Visual */}
            <Reveal delay={0.16} className="lg:col-span-6 min-w-0">
              <ShowcaseVisualCard
                src="/showcase/ui-product-review.png"
                alt="BugSnap visual feedback view with numbered pinned comments on a pricing page during product review"
              />
            </Reveal>
          </div>

          {/* Section 4: Customer Support */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Support Escalation Visual */}
            <Reveal
              delay={0.16}
              className="lg:col-span-6 min-w-0 order-2 lg:order-1"
            >
              <ShowcaseVisualCard
                src="/showcase/ui-support-escalation.png"
                alt="BugSnap customer support escalation card with session video, auto-attached HTTP 500 diagnostics, and Slack or Jira handoff"
              />
            </Reveal>

            {/* Right: Text */}
            <Reveal
              delay={0.1}
              className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5 order-1 lg:order-2"
            >
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("solutions.support.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.support.role")}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.support.desc")}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.support.point1")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.support.point2")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.support.point3")}
                  </span>
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Section 5: Bottom CTA Card */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm min-w-0">
              <div className="space-y-1.5 max-w-xl min-w-0">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("solutions.ctaEyebrow")}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t("solutions.ctaTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t("solutions.ctaDesc")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 min-w-0">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
                >
                  <Icon
                    icon="logos:chrome"
                    className="w-5 h-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{t("extension.addToChrome")}</span>
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
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
