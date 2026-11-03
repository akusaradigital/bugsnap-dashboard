"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

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

type FilterTabId =
  | "all"
  | "devtools"
  | "studio"
  | "privacy"
  | "spa"
  | "automation";

export function FeaturesContent() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<FilterTabId>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs: { id: FilterTabId; label: string }[] = [
    { id: "all", label: t("features.tabAll") || "All Capabilities" },
    {
      id: "devtools",
      label: t("features.tabDevTools") || "DevTools & Telemetry",
    },
    { id: "studio", label: t("features.tabStudio") || "Screen & Studio" },
    {
      id: "privacy",
      label: t("features.tabPrivacy") || "Zero Storage & Privacy",
    },
    { id: "spa", label: t("features.tabSpa") || "SPA Diagnostics" },
    {
      id: "automation",
      label: t("features.tabAutomation") || "Playwright & AI MCP",
    },
  ];

  // Determine section visibility based on selected tab
  const showSection1 = activeTab === "all" || activeTab === "devtools";
  const showSection2 = activeTab === "all" || activeTab === "studio";
  const showSection3 = activeTab === "all" || activeTab === "privacy";
  const showSection4 = activeTab === "all" || activeTab === "spa";
  const showSection5 = activeTab === "all" || activeTab === "automation";

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-10 sm:pt-16 pb-8 sm:pb-12">
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal delay={0}>
              {/* Breadcrumb */}
              <nav
                className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("landing.home") || "Home"}
                </Link>
                <span className="text-slate-300 dark:text-slate-600">›</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t("features.breadcrumb") || "Product Capabilities"}
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {t("features.title") ||
                  "The Bug Reporting Toolkit Built for High-Velocity Teams"}
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                {t("features.subtitle") ||
                  "From intelligent capture to automated debugging, BugSnap gives modern teams visibility, context, and AI-ready data — without slowing down their workflow."}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Tab Filter Bar */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2 -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shrink-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Capabilities Sections */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-20 sm:pb-28 space-y-16 sm:space-y-24">
          {/* SECTION 1: DEVTOOLS & TELEMETRY */}
          {showSection1 && (
            <Reveal delay={0.05}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Text Content */}
                <div className="lg:col-span-6 min-w-0 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s1Eyebrow") || "DEVTOOLS & TELEMETRY"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {t("features.s1Title") ||
                      "Automated Console & Network Telemetry"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s1Desc") ||
                      "BugSnap automatically captures browser console logs, network requests, errors, and key runtime data so you get the full technical context of an issue — without asking users to do anything manually."}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s1Bullet1") ||
                          "Captures logs, network requests, and error messages with rich metadata (URL, headers, status, etc.)"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s1Bullet2") ||
                          "Works in the background — 1-click from extension, no manual steps"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s1Bullet3") ||
                          "Structures data for easy debugging and AI analysis"}
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
                          JSON <Icon icon="lucide:chevron-down" className="w-3 h-3" />
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
          {showSection2 && (
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
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                          Events
                        </span>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>User Click</span>
                            <span className="text-[11px] font-mono text-slate-400">00:02.1</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>Input Change</span>
                            <span className="text-[11px] font-mono text-slate-400">00:03.4</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>Network Request</span>
                            <span className="text-[11px] font-mono text-slate-400">00:04.8</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                            <span className="font-semibold">Console Error</span>
                            <span className="text-[11px] font-mono text-rose-500">00:06.2</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>User Scroll</span>
                            <span className="text-[11px] font-mono text-slate-400">00:08.1</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60">
                            <span>API Response</span>
                            <span className="text-[11px] font-mono text-slate-400">00:10.3</span>
                          </div>
                        </div>
                      </div>

                      {/* Video Player Preview */}
                      <div className="sm:col-span-7 flex flex-col justify-between bg-white dark:bg-slate-900">
                        {/* Mock App Screen inside Video Viewport */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400 text-xs">←</span>
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
                            aria-label="Play"
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
                    {t("features.s2Eyebrow") || "VISUAL STUDIO"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {t("features.s2Title") ||
                      "High-Definition Visual Studio & Annotations"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s2Desc") ||
                      "Capture high-resolution screenshots, screen recordings, and audio with built-in annotation tools. Give clear visual context so your team can understand and reproduce issues instantly."}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s2Bullet1") ||
                          "High-definition screenshots and video recordings (tab, window, or full screen)"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s2Bullet2") ||
                          "Annotations, arrows, text, and highlights to point out key details"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s2Bullet3") ||
                          "Audio recording with microphone support for better context"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 3: PRIVACY & DATA CONTROL */}
          {showSection3 && (
            <Reveal delay={0.1}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Text Content */}
                <div className="lg:col-span-6 min-w-0 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s3Eyebrow") || "PRIVACY & DATA CONTROL"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {t("features.s3Title") ||
                      "Client-Side Redaction & Zero Server Retention"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s3Desc") ||
                      "Keep sensitive information safe. Redact personal data directly in your browser before it's saved, and store everything in your own Google Drive — with zero server retention."}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s3Bullet1") ||
                          "Automatic and manual redaction for emails, tokens, credit cards, phone numbers, and custom patterns"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s3Bullet2") ||
                          "Data never stored on our servers — saved directly to your Google Drive"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s3Bullet3") ||
                          "Full control over what to include or exclude"}
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
                            className="text-slate-400 dark:text-slate-500 cursor-default"
                            aria-label="Options (illustration)"
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
                            className="text-slate-400 dark:text-slate-500 cursor-default"
                            aria-label="Options (illustration)"
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
                            className="text-slate-400 dark:text-slate-500 cursor-default"
                            aria-label="Options (illustration)"
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
                            className="text-slate-400 dark:text-slate-500 cursor-default"
                            aria-label="Options (illustration)"
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
          {showSection4 && (
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
                    <div className="grid grid-cols-3 gap-3">
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
                          <span>JS Heap</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                          <span>DOM Nodes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                          <span>Event Listeners</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Text Content */}
                <div className="lg:col-span-6 min-w-0 order-1 lg:order-2 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s4Eyebrow") || "PERFORMANCE & DIAGNOSTICS"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {t("features.s4Title") ||
                      "SPA Memory Leak & DOM Bloat Detector"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s4Desc") ||
                      "Built-in performance insights to help you find memory leaks, excessive DOM growth, and long-running JavaScript tasks. Identify issues early with clear metrics and visualizations."}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s4Bullet1") ||
                          "Real-time memory usage, DOM node count, and performance metrics"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s4Bullet2") ||
                          "Detect potential memory leaks and DOM bloat"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s4Bullet3") ||
                          "Highlights long tasks, heavy event listeners, and suspicious activity"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          )}

          {/* SECTION 5: AUTOMATION & AI INTEGRATION */}
          {showSection5 && (
            <Reveal delay={0.14}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Text Content */}
                <div className="lg:col-span-6 min-w-0 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {t("features.s5Eyebrow") || "AUTOMATION & AI INTEGRATION"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {t("features.s5Title") ||
                      "Playwright Regression Tests & AI MCP Server"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("features.s5Desc") ||
                      "Go beyond manual bug reports. Generate runnable Playwright tests from user actions and connect with MCP servers for AI agents like Claude Code, Claude Desktop, or Cursor."}
                  </p>
                  <ul className="space-y-3 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s5Bullet1") ||
                          "Auto-generates Playwright regression tests from user sessions"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s5Bullet2") ||
                          "Works with MCP server for AI agents (Claude Code, Claude Desktop, Cursor)"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t("features.s5Bullet3") ||
                          "Export tests directly to your repository"}
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
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/60 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
              <div className="space-y-1 min-w-0 max-w-2xl">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("features.bannerTitle") ||
                    "Inspect the full technical telemetry schema"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("features.bannerSubtitle") ||
                    "Explore payload structure, field definitions, and examples to integrate with your own tools."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/docs"
                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm shadow-2xs transition-colors"
                >
                  {t("features.bannerDocsBtn") || "Read Developer Docs"}
                </Link>
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#89BD49] hover:bg-[#78a83f] text-slate-900 font-bold px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.99]"
                >
                  <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" />
                  <span>
                    {t("features.bannerChromeBtn") || "Add to Chrome - Free"}
                  </span>
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
