"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

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
              className="inline-flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 sm:mb-6"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t("landing.home") || "Home"}
              </Link>
              <span className="text-slate-300 dark:text-slate-600 font-normal select-none">
                ›
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {t("howItWorks.breadcrumb") || "How BugSnap Works"}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("howItWorks.title") || "From instant capture"}
              <br />
              <span className="text-blue-600 dark:text-blue-500">
                {t("howItWorks.titleHighlight") || "to the root-cause fix"}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("howItWorks.subtitle") ||
                "No complex setup. No dev tools. Just capture, record, redact, and share actionable bug reports."}
            </p>
          </Reveal>
        </section>

        {/* Steps Container */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-16">
          {/* STEP 01 */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-4 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
                  <span className="text-[#89BD49] dark:text-[#A8D666]">
                    {t("howItWorks.step01")}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase">
                    {t("howItWorks.cat01")}
                  </span>
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

              {/* Mockup 01 */}
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-6 overflow-hidden min-h-[340px] flex items-center justify-center">
                {/* Background web page with crop area */}
                <div className="absolute inset-0 p-4 sm:p-6 opacity-35 dark:opacity-20 pointer-events-none select-none">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 ml-2" />
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="w-20 h-8 rounded bg-blue-500/30" />
                    <div className="w-20 h-8 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  {/* Dashed crop rectangle */}
                  <div className="relative border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-lg w-44 h-32 mt-2">
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm" />
                    <div className="absolute -bottom-3 -right-3">
                      <Icon
                        icon="lucide:mouse-pointer"
                        className="w-6 h-6 text-slate-900 fill-slate-900 drop-shadow"
                      />
                    </div>
                  </div>
                </div>

                {/* BugSnap Extension Popup */}
                <div className="relative z-10 w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/icon.svg"
                        alt="BugSnap"
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded"
                      />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        BugSnap
                      </span>
                    </div>
                    <Icon
                      icon="lucide:clock"
                      className="w-4 h-4 text-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1.5">
                      {t("howItWorks.m1TabCapture")}
                    </span>
                    <span className="text-slate-400 pb-1.5">
                      {t("howItWorks.m1TabRecent")}
                    </span>
                    <span className="text-slate-400 pb-1.5">
                      {t("howItWorks.m1TabSettings")}
                    </span>
                  </div>

                  {/* Take Screenshot */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Icon icon="lucide:camera" className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t("howItWorks.m1Screenshot")}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {t("howItWorks.m1ScreenshotSub")}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-2 py-1 rounded">
                      Ctrl + Shift + S
                    </span>
                  </div>

                  {/* Start Recording */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <Icon icon="lucide:video" className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t("howItWorks.m1Recording")}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {t("howItWorks.m1RecordingSub")}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-2 py-1 rounded">
                      Ctrl + Shift + F
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* STEP 02 */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Mockup 02 (Left on desktop, second on mobile) */}
              <div className="order-2 lg:order-1 relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-6 overflow-hidden min-h-[300px] flex items-center justify-center">
                <div className="absolute inset-0 p-4 sm:p-6 opacity-35 dark:opacity-20 pointer-events-none select-none">
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                      </div>
                    </div>
                    <div className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                  </div>
                </div>

                {/* Floating Recording HUD */}
                <div className="relative z-10 bg-[#1E232A] text-white rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-2xl flex items-center gap-3 sm:gap-4 border border-slate-700/80 max-w-full overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                      00:24
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-700 shrink-0" />
                  <span className="text-slate-300 shrink-0">
                    <Icon icon="lucide:mic" className="w-4 h-4" />
                  </span>
                  <span className="text-slate-300 shrink-0">
                    <Icon
                      icon="lucide:mouse-pointer-click"
                      className="w-4 h-4"
                    />
                  </span>
                  <span className="text-slate-300 shrink-0">
                    <Icon icon="lucide:pen-line" className="w-4 h-4" />
                  </span>
                  <span className="text-slate-300 shrink-0">
                    <Icon icon="lucide:scan" className="w-4 h-4" />
                  </span>
                  <button
                    type="button"
                    className="bg-[#E53E3E] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm shrink-0"
                  >
                    {t("howItWorks.m2Stop")}
                  </button>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-4 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
                  <span className="text-[#89BD49] dark:text-[#A8D666]">
                    {t("howItWorks.step02")}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase">
                    {t("howItWorks.cat02")}
                  </span>
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

          {/* STEP 03 */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-4 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
                  <span className="text-[#89BD49] dark:text-[#A8D666]">
                    {t("howItWorks.step03")}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase">
                    {t("howItWorks.cat03")}
                  </span>
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

              {/* Mockup 03 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 w-28 sm:w-36 shrink-0">
                      {t("howItWorks.m3Email")}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex-1 truncate">
                      j••••@company.com
                    </span>
                    <span className="shrink-0 bg-[#E8F8F0] dark:bg-emerald-950/40 text-[#10B981] dark:text-emerald-400 border border-[#C6F0DC] dark:border-emerald-800/60 font-semibold text-[11px] px-3 py-0.5 rounded-full">
                      {t("howItWorks.m3Redacted")}
                    </span>
                  </div>
                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 w-28 sm:w-36 shrink-0">
                      {t("howItWorks.m3CreditCard")}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex-1 truncate">
                      •••• •••• •••• 4242
                    </span>
                    <span className="shrink-0 bg-[#E8F8F0] dark:bg-emerald-950/40 text-[#10B981] dark:text-emerald-400 border border-[#C6F0DC] dark:border-emerald-800/60 font-semibold text-[11px] px-3 py-0.5 rounded-full">
                      {t("howItWorks.m3Redacted")}
                    </span>
                  </div>
                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 w-28 sm:w-36 shrink-0">
                      {t("howItWorks.m3Phone")}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex-1 truncate">
                      +62 ••••• ••••••
                    </span>
                    <span className="shrink-0 bg-[#E8F8F0] dark:bg-emerald-950/40 text-[#10B981] dark:text-emerald-400 border border-[#C6F0DC] dark:border-emerald-800/60 font-semibold text-[11px] px-3 py-0.5 rounded-full">
                      {t("howItWorks.m3Redacted")}
                    </span>
                  </div>
                  <div className="py-3.5 flex items-center justify-between gap-4">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 w-28 sm:w-36 shrink-0">
                      {t("howItWorks.m3ApiKey")}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex-1 truncate">
                      sk-••••••••••••••••
                    </span>
                    <span className="shrink-0 bg-[#E8F8F0] dark:bg-emerald-950/40 text-[#10B981] dark:text-emerald-400 border border-[#C6F0DC] dark:border-emerald-800/60 font-semibold text-[11px] px-3 py-0.5 rounded-full">
                      {t("howItWorks.m3Redacted")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* STEP 04 */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Mockup 04 (Left on desktop, second on mobile) */}
              <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="logos:google-drive"
                      className="w-5 h-5 shrink-0"
                    />
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      {t("howItWorks.m4GoogleDrive")}
                    </span>
                  </div>
                  <Icon
                    icon="lucide:search"
                    className="w-4 h-4 text-slate-400"
                  />
                </div>

                <div className="flex">
                  {/* Left Sidebar */}
                  <div className="w-32 sm:w-40 border-r border-slate-100 dark:border-slate-800 p-2 sm:p-3 space-y-1 text-xs shrink-0">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium">
                      <Icon icon="lucide:folder" className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {t("howItWorks.m4MyDrive")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#E8F0FE] dark:bg-blue-950/60 text-[#1A73E8] dark:text-blue-400 font-bold">
                      <Icon icon="lucide:folder" className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {t("howItWorks.m4BugSnap")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium">
                      <Icon icon="lucide:users" className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {t("howItWorks.m4Shared")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium">
                      <Icon icon="lucide:clock" className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {t("howItWorks.m4Recent")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium">
                      <Icon icon="lucide:star" className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {t("howItWorks.m4Starred")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium">
                      <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                      <span className="truncate">{t("howItWorks.m4Trash")}</span>
                    </div>
                  </div>

                  {/* File List */}
                  <div className="flex-1 p-3 text-xs overflow-x-auto min-w-0">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                      <span>{t("howItWorks.m4Name")}</span>
                      <span>{t("howItWorks.m4LastModified")}</span>
                    </div>
                    <div className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                      <div className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            <Icon icon="lucide:video" className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-medium">
                            bug-report-2024-10-27.mp4
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Oct 27, 2024
                        </span>
                      </div>

                      <div className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Icon
                              icon="lucide:file-code"
                              className="w-3.5 h-3.5"
                            />
                          </span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-medium">
                            console-logs.json
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Oct 27, 2024
                        </span>
                      </div>

                      <div className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                            <Icon
                              icon="lucide:file-text"
                              className="w-3.5 h-3.5"
                            />
                          </span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-medium">
                            network-requests.har
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Oct 27, 2024
                        </span>
                      </div>

                      <div className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            <Icon icon="lucide:file" className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-medium">
                            environment.txt
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Oct 27, 2024
                        </span>
                      </div>

                      <div className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Icon icon="lucide:image" className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-medium">
                            screenshot.png
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Oct 27, 2024
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-4 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
                  <span className="text-[#89BD49] dark:text-[#A8D666]">
                    {t("howItWorks.step04")}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase">
                    {t("howItWorks.cat04")}
                  </span>
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

          {/* STEP 05 */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-4 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
                  <span className="text-[#89BD49] dark:text-[#A8D666]">
                    {t("howItWorks.step05")}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase">
                    {t("howItWorks.cat05")}
                  </span>
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

              {/* Mockup 05 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="lucide:bug"
                      className="w-4 h-4 text-slate-800 dark:text-slate-200"
                    />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {t("howItWorks.m5BugReport")}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                    <Icon icon="lucide:copy" className="w-3 h-3 text-slate-400" />
                    <span>{t("howItWorks.m5CopyLink")}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-800 text-[11px] pt-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1.5">
                    {t("howItWorks.m5TabSummary")}
                  </span>
                  <span className="text-slate-400 pb-1.5">
                    {t("howItWorks.m5TabConsole")}
                  </span>
                  <span className="text-slate-400 pb-1.5">
                    {t("howItWorks.m5TabNetwork")}
                  </span>
                  <span className="text-slate-400 pb-1.5">
                    {t("howItWorks.m5TabEnvironment")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-3.5 items-start">
                  {/* Left Column Data */}
                  <div className="sm:col-span-7 space-y-2.5 text-[11px] min-w-0">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {t("howItWorks.m5TitleLabel")}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {t("howItWorks.m5TitleValue")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {t("howItWorks.m5DescLabel")}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 leading-snug">
                        {t("howItWorks.m5DescValue")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {t("howItWorks.m5EnvLabel")}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {t("howItWorks.m5EnvValue")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {t("howItWorks.m5UrlLabel")}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono break-all">
                        https://example.com/checkout
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {t("howItWorks.m5CreatedLabel")}
                      </span>
                      <span className="text-slate-500">
                        {t("howItWorks.m5CreatedValue")}
                      </span>
                    </div>
                  </div>

                  {/* Right Thumbnail & Jira Export */}
                  <div className="sm:col-span-5 space-y-2.5 min-w-0">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-2.5 aspect-[4/3] flex flex-col justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      </div>
                      <div className="w-full h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          Checkout
                        </span>
                      </div>
                      <div className="w-1/2 h-2 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>

                    <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#1A73E8] dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 py-2 px-3 rounded-xl">
                      <Icon icon="lucide:share-2" className="w-3.5 h-3.5" />
                      <span>{t("howItWorks.m5ExportJira")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* STEP 06 */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Mockup 06 (Left on desktop, second on mobile) */}
              <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 overflow-hidden font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 font-sans">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1">
                      {t("howItWorks.m6TabPlaywright")}
                    </span>
                    <span className="text-slate-400 pb-1">
                      {t("howItWorks.m6TabSteps")}
                    </span>
                    <span className="text-slate-400 pb-1">
                      {t("howItWorks.m6TabAi")}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                    <Icon icon="lucide:copy" className="w-3 h-3 text-slate-400" />
                    <span>{t("howItWorks.m6Copy")}</span>
                  </span>
                </div>

                <pre className="pt-3 text-[11px] sm:text-xs leading-relaxed overflow-x-auto text-slate-800 dark:text-slate-200">
                  <code>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        1
                      </span>
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">
                        import
                      </span>{" "}
                      &#123; test, expect &#125;{" "}
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">
                        from
                      </span>{" "}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        &#39;@playwright/test&#39;
                      </span>
                      ;
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        2
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        3
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        test
                      </span>
                      (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        &#39;checkout button works&#39;
                      </span>
                      ,{" "}
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">
                        async
                      </span>{" "}
                      (&#123; page &#125;) =&gt; &#123;
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        4
                      </span>
                      {"  "}
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">
                        await
                      </span>{" "}
                      page.
                      <span className="text-blue-600 dark:text-blue-400">
                        goto
                      </span>
                      (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        &#39;https://example.com/checkout&#39;
                      </span>
                      );
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        5
                      </span>
                      {"  "}
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">
                        await
                      </span>{" "}
                      page.
                      <span className="text-blue-600 dark:text-blue-400">
                        click
                      </span>
                      (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        &#39;button:has-text(&quot;Checkout&quot;)&#39;
                      </span>
                      );
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        6
                      </span>
                      {"  "}
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">
                        await
                      </span>{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        expect
                      </span>
                      (page.
                      <span className="text-blue-600 dark:text-blue-400">
                        locator
                      </span>
                      (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        &#39;.success-message&#39;
                      </span>
                      )).
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        7
                      </span>
                      {"    "}
                      <span className="text-blue-600 dark:text-blue-400">
                        toBeVisible
                      </span>
                      ();
                    </div>
                    <div>
                      <span className="text-slate-400 select-none mr-3 w-3 inline-block text-right">
                        8
                      </span>
                      &#125;);
                    </div>
                  </code>
                </pre>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-4 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
                  <span className="text-[#89BD49] dark:text-[#A8D666]">
                    {t("howItWorks.step06")}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 uppercase">
                    {t("howItWorks.cat06")}
                  </span>
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
            <div className="rounded-2xl border border-[#DCEBC9] dark:border-[#2D4524] bg-[#F2F8ED] dark:bg-[#182614] p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1 text-left min-w-0 flex-1">
                <div className="text-[11px] font-bold text-[#6B9A35] dark:text-[#A8D666] tracking-wider uppercase">
                  {t("howItWorks.ctaEyebrow")}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t("howItWorks.ctaTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t("howItWorks.ctaDesc")}
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#89BD49] hover:bg-[#7ba941] text-slate-900 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.99] whitespace-nowrap"
                >
                  <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" />
                  <span>{t("howItWorks.ctaBtn")}</span>
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
