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

export function SolutionsContent() {
  const { t } = useT();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 font-site flex flex-col bg-[#fcfdfe] dark:bg-[#0b0f17]">
      <SiteNavbar />

      <main id="main-content" className="flex-1 pb-12 sm:pb-16">
        {/* Hero Section */}
        <div className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal delay={0}>
            {/* Breadcrumb */}
            <nav
              className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t("landing.home") || "Home"}
              </Link>
              <span className="text-slate-400 dark:text-slate-600 font-normal" aria-hidden="true">
                /
              </span>
              <span className="text-slate-900 dark:text-white font-medium">
                {t("site.nav.solutions") || "Solutions"}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("solutions.title") || "Clarity for every role"}
              <br />
              <span className="text-blue-600 dark:text-blue-500">
                {t("solutions.titleHighlight") || "in the debugging loop"}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("solutions.subtitle") ||
                "From initial discovery to root-cause fix, BugSnap removes the friction between reporters, engineers, and product managers."}
            </p>
          </Reveal>
        </div>

        {/* 4 Alternating Solutions Sections */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Section 1: Quality Assurance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Text */}
            <Reveal delay={0.1} className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("solutions.qa.badge") || "QUALITY ASSURANCE"}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.qa.role") ||
                  "File airtight bug reports in seconds, not minutes"}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.qa.desc") ||
                  "Stop typing. BugSnap captures the exact technical context automatically — from screenshots to console logs."}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.qa.point1") ||
                      "Record with hotkeys (Ctrl+Shift+F)"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.qa.point2") ||
                      "Automatic capture of console errors, network headers, and SPA memory"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.qa.point3") ||
                      "Auto-generates runnable Playwright regression tests"}
                  </span>
                </li>
              </ul>
            </Reveal>

            {/* Right: Mockup */}
            <Reveal delay={0.16} className="lg:col-span-6 min-w-0">
              <div className="relative">
                {/* Decorative Sparkles on Top-Left */}
                <div className="absolute -top-3.5 -left-3.5 pointer-events-none text-blue-500 select-none z-10 hidden sm:block">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M4 14L8 10M10 4L8 10" />
                  </svg>
                </div>

                {/* Decorative Pointer Cursor on Bottom-Right */}
                <div className="absolute -bottom-3.5 -right-3 pointer-events-none text-blue-600 select-none z-20">
                  <svg
                    className="w-6 h-6 text-blue-600 drop-shadow-md"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4 3l7 17 2.5-6.5L20 11 4 3z" />
                  </svg>
                </div>

                {/* Window Container */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-5 sm:p-6 space-y-4">
                  {/* macOS Dots */}
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  </div>

                  {/* Header Subrow */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        QA Step & Audio Log
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                      Sync to Jira
                    </span>
                  </div>

                  {/* Step 1 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>Step 1 (00:04)</span>
                      <span className="font-mono">10:14:23</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      User typed &quot;sampress&quot;
                    </div>
                  </div>

                  {/* Step 2 - Alert Box */}
                  <div className="rounded-xl bg-red-50/80 dark:bg-red-950/25 border border-red-100 dark:border-red-900/40 p-3 sm:p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
                      <span>Step 2 (00:12) – Exception</span>
                      <span className="text-[11px] font-mono text-red-400/80 dark:text-red-400">
                        10:14:35
                      </span>
                    </div>
                    <div className="text-xs font-mono font-medium text-red-600 dark:text-red-400 break-all">
                      POST /api/projects/apply &gt; 500 - Unexpected token
                    </div>
                  </div>

                  {/* Audio Player Bar */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-2.5 sm:p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Icon
                          icon="lucide:play"
                          className="w-3 h-3 fill-current ml-0.5"
                        />
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                        Audio: &quot;saat klik save muncul error&quot;
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      <span>00:00 / 00:24</span>
                      
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Section 2: Engineering */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Mockup */}
            <Reveal
              delay={0.16}
              className="lg:col-span-6 min-w-0 order-2 lg:order-1"
            >
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-4 sm:p-6 shadow-sm">
                <div className="rounded-xl bg-[#0c1322] border border-slate-800 p-4 sm:p-5 font-mono shadow-md space-y-4">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 font-sans ml-1">
                        Developer Debug Console
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          "curl -X POST https://app.example.com/api/projects -H 'Content-Type: application/json'",
                          "curl"
                        )
                      }
                      className="text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1 font-sans transition-colors cursor-pointer"
                    >
                      <span>cURL</span>
                      <Icon
                        icon={
                          copiedItem === "curl"
                            ? "lucide:check"
                            : "lucide:copy"
                        }
                        className="w-3 h-3 text-slate-400"
                      />
                    </button>
                  </div>

                  {/* Terminal Content */}
                  <div className="space-y-3 text-xs">
                    {/* Error Stack */}
                    <div className="text-red-400 leading-relaxed break-all font-mono">
                      <div>TypeError: Cannot read properties of undefined</div>
                      <div className="pl-4 text-red-400/80">
                        at onSubmit (Form.tsx:48:12)
                      </div>
                    </div>

                    {/* Network Request 1 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-slate-300 truncate">
                          GET /api/users
                        </span>
                        <span className="text-emerald-400 font-bold whitespace-nowrap">
                          200{" "}
                          <span className="text-slate-500 font-normal">
                            (342 ms)
                          </span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyText("curl https://app.example.com/api/users", "users")
                        }
                        className="text-teal-400 hover:text-teal-300 text-xs font-sans font-medium transition-colors ml-2 shrink-0 cursor-pointer"
                      >
                        {copiedItem === "users" ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    {/* Network Request 2 */}
                    <div className="flex items-center justify-between pt-1 font-mono">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-slate-300 truncate">
                          POST /api/projects
                        </span>
                        <span className="text-red-400 font-bold whitespace-nowrap">
                          500{" "}
                          <span className="text-slate-500 font-normal">
                            (123 ms)
                          </span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            "curl -X POST https://app.example.com/api/projects",
                            "projects"
                          )
                        }
                        className="text-teal-400 hover:text-teal-300 text-xs font-sans font-medium transition-colors ml-2 shrink-0 cursor-pointer"
                      >
                        {copiedItem === "projects" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right: Text */}
            <Reveal
              delay={0.1}
              className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5 order-1 lg:order-2"
            >
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("solutions.dev.badge") || "ENGINEERING"}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.dev.role") ||
                  "Fix bugs on the first pass with full diagnostic context"}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.dev.desc") ||
                  "Inspect HTTP status codes, request bodies, stack traces, and device specs side-by-side with video. Never ask for \"more info\" again."}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.dev.point1") ||
                      "Full, unedited sessions with complete stack traces"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.dev.point2") ||
                      "Exact HTTP payloads, headers, and responses"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.dev.point3") ||
                      "Native MCP server lets AI agents read and fix bugs directly"}
                  </span>
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Section 3: Product Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Text */}
            <Reveal delay={0.1} className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("solutions.pm.badge") || "PRODUCT MANAGEMENT"}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.pm.role") ||
                  "Communicate visual anomalies and edge cases with precision"}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.pm.desc") ||
                  "Annotate screenshots, add comments or draw directly on the screen. Share, track, and manage issues — all in one place."}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.pm.point1") ||
                      "On-screen callouts, arrows, and visual markers"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.pm.point2") ||
                      "Interactive web links that open directly to issues"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.pm.point3") ||
                      "Private Google Drive links without video file upload limits"}
                  </span>
                </li>
              </ul>
            </Reveal>

            {/* Right: Mockup */}
            <Reveal delay={0.16} className="lg:col-span-6 min-w-0">
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-4 sm:p-6 shadow-sm">
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden relative">
                  {/* Browser Dots */}
                  <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  </div>

                  {/* Browser Mockup Body */}
                  <div className="flex p-3 sm:p-4 gap-3 relative min-h-[220px]">
                    {/* Mini Sidebar */}
                    <div className="w-7 sm:w-8 shrink-0 flex flex-col items-center gap-2.5 py-1 border-r border-slate-100 dark:border-slate-800 pr-2">
                      <div className="w-4 h-4 rounded bg-slate-300 dark:bg-slate-700" />
                      <div className="w-4 h-4 rounded bg-blue-500" />
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Top Toolbar */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="w-8 h-2 rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="w-16 h-4 rounded-full bg-slate-100 dark:bg-slate-800" />
                      </div>

                      {/* Comment Annotation & Red Dashed Box */}
                      <div className="relative pt-1 pb-1">
                        {/* Floating Comment Bubble */}
                        <div className="flex items-center gap-2 justify-end mb-1.5">
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-xl px-2.5 py-1.5 z-10">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-400 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              <span>S</span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              This discount text should only appear for members.
                            </span>
                          </div>
                        </div>

                        {/* Red Curved Arrow */}
                        <div className="flex justify-center -my-1">
                          <svg
                            className="w-7 h-7 text-red-500 shrink-0"
                            viewBox="0 0 32 32"
                            fill="none"
                          >
                            <path
                              d="M22 3 C19 11, 16 16, 16 26"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 21 L16 26 L20 21"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Red Dashed Box */}
                        <div className="rounded-lg border-2 border-dashed border-red-500/80 bg-red-50/40 dark:bg-red-950/20 py-2 px-4 text-center">
                          <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                            Get 30% off for members
                          </span>
                        </div>
                      </div>

                      {/* Skeleton Cards */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2 space-y-1.5">
                          <div className="w-10 h-2 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="w-full h-1.5 rounded bg-slate-100 dark:bg-slate-800" />
                          <div className="w-2/3 h-1.5 rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2 space-y-1.5">
                          <div className="w-10 h-2 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="w-full h-1.5 rounded bg-slate-100 dark:bg-slate-800" />
                          <div className="w-2/3 h-1.5 rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Section 4: Customer Support */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Mockup */}
            <Reveal
              delay={0.16}
              className="lg:col-span-6 min-w-0 order-2 lg:order-1"
            >
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-4 sm:p-6 shadow-sm">
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
                  {/* Card Title */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon icon="lucide:ticket" className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Customer Escalation Ticket
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Customer: E-Commerce Admin
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        User cannot submit VAT for exemption form
                      </div>
                    </div>

                    {/* Video Recording Thumbnail */}
                    <div className="w-24 sm:w-28 h-16 sm:h-18 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0 shadow-2xs">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:6px_6px]" />
                      <div className="w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-[10px] shadow-md pl-0.5 z-10">
                        <Icon
                          icon="lucide:play"
                          className="w-3 h-3 fill-current ml-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <Icon
                      icon="lucide:calendar"
                      className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    />
                    <span className="truncate">
                      Indonesia · Chrome 128 · 1920 × 1080 · 00:42
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right: Text */}
            <Reveal
              delay={0.1}
              className="lg:col-span-6 min-w-0 space-y-4 sm:space-y-5 order-1 lg:order-2"
            >
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("solutions.support.badge") || "CUSTOMER SUPPORT"}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("solutions.support.role") ||
                  "Turn customer issues into actionable engineering tickets"}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {t("solutions.support.desc") ||
                  "Gather the technical details silently in the background without needing customer-facing agents to understand DevTools."}
              </p>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.support.point1") ||
                      "Background diagnostic capture without asking users for DevTools"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.support.point2") ||
                      "Export complete ticket summaries to helpdesk systems"}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon
                    icon="lucide:check"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]"
                  />
                  <span>
                    {t("solutions.support.point3") ||
                      "One share link contains recordings, logs, and network details"}
                  </span>
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Section 5: Bottom CTA Card */}
          <Reveal delay={0.2}>
            <div className="rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1.5 max-w-xl">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("solutions.ctaEyebrow") || "READY TO SHIP FASTER?"}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Equip your whole team with{" "}
                  <span className="text-blue-600 dark:text-blue-500">
                    BugSnap
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t("solutions.ctaDesc") ||
                    "Free. Saves directly to your team's Google Drive. No server lock-in."}
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
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
