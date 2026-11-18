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

export function HowItWorksContent() {
  const { t } = useT();

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb & Hero */}
        <section className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <Reveal delay={0}>
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
              <span className="text-slate-300 dark:text-slate-600 font-normal select-none" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {t("howItWorks.breadcrumb")}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("howItWorks.title")}
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">
                {t("howItWorks.titleHighlight")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className={HERO_SUBTITLE_CLS}>
              {t("howItWorks.subtitle")}
            </p>
          </Reveal>
        </section>

        {/* Steps Container */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-16">
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-4 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.cat01")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.title01")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("howItWorks.desc01")}
                </p>
                <ul className="space-y-2.5 pt-2">
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b1_1")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b1_2")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b1_3")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Visual 01: Latest Extension Popup & Active Tab Capture */}
              <ShowcaseVisualCard
                src="/showcase/ui-capture-popup.png"
                alt="BugSnap extension popup capturing an active checkout tab with Mode and Format controls"
              />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual 02 (Left on desktop, second on mobile) */}
              <div className="order-2 lg:order-1 min-w-0">
                <ShowcaseVisualCard
                  src="/showcase/ui-editor-annotations.png"
                  alt="BugSnap visual editor annotating an HTTP 500 error with red callout, blurred PII, and AI Polish"
                />
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-4 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.cat02")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.title02")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("howItWorks.desc02")}
                </p>
                <ul className="space-y-2.5 pt-2">
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b2_1")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b2_2")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b2_3")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-4 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.cat03")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.title03")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("howItWorks.desc03")}
                </p>
                <ul className="space-y-2.5 pt-2">
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b3_1")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b3_2")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b3_3")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Visual 03: Client-Side Privacy Redaction */}
              <ShowcaseVisualCard
                src="/showcase/ui-privacy-redaction.png"
                alt="BugSnap client-side privacy redaction masking emails, credit cards, bearer tokens, and API secrets in the browser"
              />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual 04 (Left on desktop, second on mobile) */}
              <div className="order-2 lg:order-1 min-w-0">
                <ShowcaseVisualCard
                  src="/showcase/ui-drive-storage.png"
                  alt="BugSnap streaming recordings, screenshots, console logs, and HAR traces directly to Google Drive"
                />
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-4 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.cat04")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.title04")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("howItWorks.desc04")}
                </p>
                <ul className="space-y-2.5 pt-2">
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b4_1")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b4_2")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b4_3")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-4 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.cat05")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.title05")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("howItWorks.desc05")}
                </p>
                <ul className="space-y-2.5 pt-2">
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b5_1")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b5_2")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b5_3")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Visual 05: Triage & Issue Tracker Export */}
              <ShowcaseVisualCard
                src="/showcase/ui-triage-export.png"
                alt="BugSnap share access controls and export integrations for Jira, Linear, GitHub, Slack, Notion, and MCP"
              />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual 06 (Left on desktop, second on mobile) */}
              <div className="order-2 lg:order-1 min-w-0">
                <ShowcaseVisualCard
                  src="/showcase/ui-playwright-ai.png"
                  alt="BugSnap generating runnable Playwright regression tests and AI fix blueprints from captured user steps"
                />
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-4 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.cat06")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.title06")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("howItWorks.desc06")}
                </p>
                <ul className="space-y-2.5 pt-2">
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b6_1")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b6_2")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon
                      icon="lucide:check"
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666] shrink-0 mt-0.5 stroke-[2.5]"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {t("howItWorks.b6_3")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Bottom CTA Banner */}
          <Reveal delay={0.08}>
            <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm min-w-0">
              <div className="space-y-1.5 max-w-xl min-w-0">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("howItWorks.ctaEyebrow")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t("howItWorks.ctaTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t("howItWorks.ctaDesc")}
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
                  <span>{t("extension.addToChrome")}</span>
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
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
