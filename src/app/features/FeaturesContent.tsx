"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

const DEVTOOLS_JSON = `{
  "url": "https://app.example.com/dashboard",
  "timestamp": "2026-10-27T08:24:17.391Z",
  "type": "error",
  "message": "TypeError: Cannot read property 'map' of undefined",
  "stack": [
    "at renderTable (bundle.js:234:10)",
    "at onClick (bundle.js:102:9)"
  ],
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}`;

const PLAYWRIGHT_CODE = `import { test, expect } from '@playwright/test';

test('reproduce issue: error on project creation', async ({ page }) => {
  await page.goto('https://app.example.com');
  await page.click('text=Create Project');
  await page.fill('input[name="name"]', 'BugSnap');
  await page.fill('input[name="description"]', 'Test project');
  await page.click('button:has-text("Create")');
  await expect(page.locator('.error-message'))
    .toContainText('TypeError: Cannot read property');
});`;

export function FeaturesContent() {
  const { t } = useT();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
                className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6"
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
              <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
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

                {/* Right: DevTools JSON Mockup */}
                <div className="lg:col-span-6 min-w-0">
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {/* Top Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-4 pt-3 bg-slate-50/60 dark:bg-slate-900/60">
                      <div className="flex items-center gap-6 text-xs font-semibold">
                        <button
                          type="button"
                          className="pb-3 text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white font-bold"
                        >
                          Console
                        </button>
                        <button
                          type="button"
                          className="pb-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Network
                        </button>
                        <button
                          type="button"
                          className="pb-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Errors
                        </button>
                        <button
                          type="button"
                          className="pb-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Page Info
                        </button>
                      </div>
                    </div>

                    {/* Sub-toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-[11px]">
                          All
                        </span>
                        <span className="px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer text-[11px]">
                          Log
                        </span>
                        <span className="px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer text-[11px]">
                          Warning
                        </span>
                        <span className="px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer text-[11px]">
                          Error
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 rounded cursor-pointer">
                          JSON 
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(DEVTOOLS_JSON, "devtools-json")}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Icon icon="lucide:copy" className="w-3 h-3" />
                          <span>
                            {copiedKey === "devtools-json" ? "Copied!" : "Copy"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* JSON Code Area with Line Numbers */}
                    <div className="p-4 bg-white dark:bg-slate-900 font-mono text-xs overflow-x-auto leading-relaxed">
                      <div className="flex">
                        {/* Line Numbers */}
                        <div className="select-none pr-4 text-right text-slate-300 dark:text-slate-600 space-y-0.5">
                          {Array.from({ length: 15 }, (_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                          ))}
                        </div>
                        {/* Code Content */}
                        <div className="space-y-0.5 text-slate-800 dark:text-slate-200">
                          <div>{"{"}</div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;url&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;https://app.example.com/dashboard&quot;</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;timestamp&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;2026-10-27T08:24:17.391Z&quot;</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;type&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;error&quot;</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;message&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;TypeError: Cannot read property &apos;map&apos; of undefined&quot;</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;stack&quot;</span>: [
                          </div>
                          <div>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-600 dark:text-emerald-400">&quot;at renderTable (bundle.js:234:10)&quot;</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-600 dark:text-emerald-400">&quot;at onClick (bundle.js:102:9)&quot;</span>
                          </div>
                          <div>
                            &nbsp;&nbsp;],
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;userAgent&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;Mozilla/5.0 (Windows NT 10.0; Win64; x64)&quot;</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;viewport&quot;</span>: {"{"}
                          </div>
                          <div>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;width&quot;</span>: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">1920</span>,
                          </div>
                          <div>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-600 dark:text-rose-400 font-semibold">&quot;height&quot;</span>: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">1080</span>
                          </div>
                          <div>
                            &nbsp;&nbsp;{"}"}
                          </div>
                          <div>{"}"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 2: VISUAL STUDIO */}
          {(
            <Reveal delay={0.08}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Visual Studio Mockup */}
                <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {/* Window Titlebar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      </div>
                      <div className="flex items-center gap-5 text-xs font-semibold">
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Screenshot
                        </button>
                        <button
                          type="button"
                          className="text-slate-900 dark:text-white font-bold border-b-2 border-slate-900 dark:border-white pb-0.5"
                        >
                          Video
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Audio
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Timeline
                        </button>
                      </div>
                      <div className="w-10" />
                    </div>

                    {/* Window Body: Events on Left + Mock Viewport on Right */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800">
                      {/* Events List */}
                      <div className="sm:col-span-5 p-3.5 space-y-2 bg-slate-50/30 dark:bg-slate-900/30">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block px-1">
                          Events
                        </span>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>{t("featFx.evUserClick")}</span>
                            <span className="text-[11px] font-mono text-slate-400">00:02.1</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>{t("featFx.evInputChange")}</span>
                            <span className="text-[11px] font-mono text-slate-400">00:03.4</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>{t("featFx.evNetworkRequest")}</span>
                            <span className="text-[11px] font-mono text-slate-400">00:04.8</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                            <span className="font-semibold">{t("featFx.evConsoleError")}</span>
                            <span className="text-[11px] font-mono text-rose-500">00:06.2</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>{t("featFx.evUserScroll")}</span>
                            <span className="text-[11px] font-mono text-slate-400">00:08.1</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>{t("featFx.evApiResponse")}</span>
                            <span className="text-[11px] font-mono text-slate-400">00:10.3</span>
                          </div>
                        </div>
                      </div>

                      {/* Video Player Preview */}
                      <div className="sm:col-span-7 flex flex-col justify-between bg-white dark:bg-slate-900">
                        {/* Mock App Screen inside Video Viewport */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400 text-xs" aria-hidden="true">/</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Create Project
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              Project Name
                            </span>
                            <div className="border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 font-medium">
                              BugSnap
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              Description
                            </span>
                            <div className="border border-slate-200 dark:border-slate-700 rounded px-2 py-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                              Enter description...
                            </div>
                          </div>
                          <div className="pt-1">
                            <button
                              type="button"
                              className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold shadow-xs"
                            >
                              Create
                            </button>
                          </div>
                        </div>

                        {/* Video Controls Bar */}
                        <div className="border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 bg-slate-50/80 dark:bg-slate-900/80 flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            aria-label={t("featFx.play")}
                          >
                            <Icon icon="lucide:play" className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            0:06 / 0:24
                          </span>
                          {/* Scrubber Bar */}
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-blue-600 rounded-full" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            1x
                          </span>
                          <Icon icon="lucide:volume-2" className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <Icon icon="lucide:maximize" className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
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

                {/* Right: Redaction Rules Mockup */}
                <div className="lg:col-span-6 min-w-0">
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Redaction Rules
                      </h3>
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors"
                      >
                        + Add Rule
                      </button>
                    </div>

                    {/* Rule Rows */}
                    <div className="space-y-3">
                      {/* Rule 1: Email Address */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              Email Address
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              [\w\.-]+@[\w\.-]+\.\w+
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                            Replace with *****
                          </span>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-disabled="true"
                            className="text-emerald-600 dark:text-emerald-400 cursor-default"
                            aria-label={t("featFx.optionsIllustration")}
                          >
                            <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rule 2: Credit Card Number */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              Credit Card Number
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              \b(?:\d[- ]*?){"{13,16}"}\b
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                            Replace with **** ****
                          </span>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-disabled="true"
                            className="text-emerald-600 dark:text-emerald-400 cursor-default"
                            aria-label={t("featFx.optionsIllustration")}
                          >
                            <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rule 3: API Key / Token */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              API Key / Token
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              (sk|pk|token)[\w\-_]{"{20,}"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                            Replace with *******
                          </span>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-disabled="true"
                            className="text-emerald-600 dark:text-emerald-400 cursor-default"
                            aria-label={t("featFx.optionsIllustration")}
                          >
                            <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rule 4: Phone Number */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              Phone Number
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              \+?\d{"{7,15}"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                            Replace with ********
                          </span>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-disabled="true"
                            className="text-emerald-600 dark:text-emerald-400 cursor-default"
                            aria-label={t("featFx.optionsIllustration")}
                          >
                            <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 4: PERFORMANCE & DIAGNOSTICS */}
          {(
            <Reveal delay={0.12}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Performance Monitor Mockup */}
                <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          Performance
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
                        <button
                          type="button"
                          className="text-slate-900 dark:text-white font-bold border-b-2 border-slate-900 dark:border-white pb-0.5"
                        >
                          Memory
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          DOM
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Console
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Network
                        </button>
                      </div>
                    </div>

                    {/* 3 Metric Tiles with Sparklines */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Tile 1: JS Heap */}
                      <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          JS Heap
                        </span>
                        <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                          48.2 MB
                        </div>
                        {/* Mini Sparkline Curve */}
                        <div className="h-6 w-full pt-1">
                          <svg className="w-full h-full" viewBox="0 0 60 20" fill="none">
                            <path
                              d="M 0 15 Q 15 12 30 14 T 60 5"
                              stroke="#10b981"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Tile 2: DOM Nodes */}
                      <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          DOM Nodes
                        </span>
                        <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                          1,842
                        </div>
                        {/* Mini Sparkline Curve */}
                        <div className="h-6 w-full pt-1">
                          <svg className="w-full h-full" viewBox="0 0 60 20" fill="none">
                            <path
                              d="M 0 17 Q 20 15 35 10 T 60 4"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Tile 3: Event Listeners */}
                      <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Event Listeners
                        </span>
                        <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                          276
                        </div>
                        {/* Mini Sparkline Curve */}
                        <div className="h-6 w-full pt-1">
                          <svg className="w-full h-full" viewBox="0 0 60 20" fill="none">
                            <path
                              d="M 0 12 Q 15 14 30 8 T 60 6"
                              stroke="#f59e0b"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Graph */}
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Timeline (Last 60s)
                      </div>
                      <div className="relative h-32 sm:h-36 w-full bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
                        {/* Y-axis Labels & Gridlines */}
                        <div className="absolute inset-x-3 top-3 bottom-8 flex flex-col justify-between pointer-events-none">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>120 MB</span>
                            <div className="flex-1 ml-2 border-b border-dashed border-slate-200 dark:border-slate-700/60" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>60 MB</span>
                            <div className="flex-1 ml-2 border-b border-dashed border-slate-200 dark:border-slate-700/60" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>0 MB</span>
                            <div className="flex-1 ml-2 border-b border-dashed border-slate-200 dark:border-slate-700/60" />
                          </div>
                        </div>

                        {/* Multi-series SVG Line Chart */}
                        <div className="absolute inset-x-12 top-4 bottom-8">
                          <svg
                            className="w-full h-full overflow-visible"
                            viewBox="0 0 300 80"
                            preserveAspectRatio="none"
                            fill="none"
                          >
                            {/* Teal Line: JS Heap */}
                            <path
                              d="M 0 65 Q 50 60 100 50 T 200 35 T 300 20"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Blue Line: DOM Nodes */}
                            <path
                              d="M 0 70 Q 60 68 120 55 T 220 40 T 300 28"
                              stroke="#3b82f6"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Orange Line: Event Listeners */}
                            <path
                              d="M 0 55 Q 70 58 140 45 T 240 38 T 300 32"
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        {/* X-axis Labels */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pl-10 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 mt-auto">
                          <span>0s</span>
                          <span>10s</span>
                          <span>20s</span>
                          <span>30s</span>
                          <span>40s</span>
                          <span>50s</span>
                          <span>60s</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 pt-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                          <span>{t("featFx.jsHeap")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                          <span>{t("featFx.domNodes")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                          <span>{t("featFx.eventListeners")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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

                {/* Right: Playwright Test Code Window Mockup */}
                <div className="lg:col-span-6 min-w-0">
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {/* Header Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 bg-slate-50/60 dark:bg-slate-900/60">
                      <div className="flex items-center gap-5 text-xs font-semibold">
                        <button
                          type="button"
                          className="text-slate-900 dark:text-white font-bold border-b-2 border-slate-900 dark:border-white pb-0.5"
                        >
                          Playwright Test
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Test Steps
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          MCP Server
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PLAYWRIGHT_CODE, "playwright-code")}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Icon icon="lucide:copy" className="w-3 h-3" />
                        <span>
                          {copiedKey === "playwright-code" ? "Copied!" : "Copy"}
                        </span>
                      </button>
                    </div>

                    {/* Code Body with Line Numbers */}
                    <div className="p-4 bg-white dark:bg-slate-900 font-mono text-xs overflow-x-auto leading-relaxed">
                      <div className="flex">
                        {/* Line Numbers */}
                        <div className="select-none pr-4 text-right text-slate-300 dark:text-slate-600 space-y-0.5">
                          {Array.from({ length: 11 }, (_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                          ))}
                        </div>
                        {/* Code Content */}
                        <div className="space-y-0.5 text-slate-800 dark:text-slate-200">
                          <div>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">import</span> {"{ test, expect }"} <span className="text-purple-600 dark:text-purple-400 font-semibold">from</span> <span className="text-emerald-600 dark:text-emerald-400">&apos;@playwright/test&apos;</span>;
                          </div>
                          <div>&nbsp;</div>
                          <div>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">test</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;reproduce issue: error on project creation&apos;</span>, <span className="text-purple-600 dark:text-purple-400 font-semibold">async</span> ({"{ page }"}) =&gt; {"{"}
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400 font-semibold">await</span> page.<span className="text-blue-600 dark:text-blue-400">goto</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;https://app.example.com&apos;</span>);
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400 font-semibold">await</span> page.<span className="text-blue-600 dark:text-blue-400">click</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;text=Create Project&apos;</span>);
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400 font-semibold">await</span> page.<span className="text-blue-600 dark:text-blue-400">fill</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;input[name=&quot;name&quot;]&apos;</span>, <span className="text-emerald-600 dark:text-emerald-400">&apos;BugSnap&apos;</span>);
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400 font-semibold">await</span> page.<span className="text-blue-600 dark:text-blue-400">fill</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;input[name=&quot;description&quot;]&apos;</span>, <span className="text-emerald-600 dark:text-emerald-400">&apos;Test project&apos;</span>);
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400 font-semibold">await</span> page.<span className="text-blue-600 dark:text-blue-400">click</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;button:has-text(&quot;Create&quot;)&apos;</span>);
                          </div>
                          <div>
                            &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400 font-semibold">await</span> <span className="text-blue-600 dark:text-blue-400">expect</span>(page.<span className="text-blue-600 dark:text-blue-400">locator</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;.error-message&apos;</span>))
                          </div>
                          <div>
                            &nbsp;&nbsp;&nbsp;&nbsp;.<span className="text-blue-600 dark:text-blue-400">toContainText</span>(<span className="text-emerald-600 dark:text-emerald-400">&apos;TypeError: Cannot read property&apos;</span>);
                          </div>
                          <div>{"});"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
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
