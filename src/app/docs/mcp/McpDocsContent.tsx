"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

export function McpDocsContent() {
  const { t } = useT();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const mcpConfigJson = `{
  "mcpServers": {
    "bugsnap": {
      "command": "npx",
      "args": ["-y", "@bugsnap/mcp"],
      "env": {
        "BUGSNAP_API_KEY": "your_api_key_here"
      }
    }
  }
}`;

  const clients = [
    {
      id: "claude-code",
      name: "Claude Code",
    },
    {
      id: "claude-desktop",
      name: "Claude Desktop",
    },
    {
      id: "cursor",
      name: "Cursor",
    },
    {
      id: "generic",
      name: "Any other MCP client",
    },
  ];

  const testCommand = "npx -y @bugsnap/mcp --api-key YOUR_BUGSNAP_API_KEY";

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-site flex flex-col bg-white dark:bg-site-surface relative overflow-hidden">
      {/* Soft ambient background glows matching reference */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[360px] bg-emerald-300/15 dark:bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute top-12 left-1/4 w-[420px] h-[320px] bg-emerald-200/20 dark:bg-emerald-500/5 blur-[110px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <SiteNavbar />

      <main id="main-content" className="flex-1 relative z-10">
        {/* Hero Section */}
        <div className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal delay={0}>
              {/* Breadcrumb with 3D isometric green cubes and Docs badge */}
              <nav
                className="inline-flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-full px-2"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("landing.home")}
                </Link>
                <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
                  &gt;
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t("docs.mcp")}
                </span>

                {/* 3D isometric green stacked cubes icon */}
                <svg
                  className="w-5 h-5 shrink-0 inline-block text-emerald-500 ml-0.5"
                  viewBox="0 0 32 32"
                  fill="none"
                  aria-hidden="true"
                >
                  {/* Top cube */}
                  <path d="M16 3 L22 6.5 L16 10 L10 6.5 Z" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 6.5 L16 10 L16 15 L10 11.5 Z" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M16 10 L22 6.5 L22 11.5 L16 15 Z" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />

                  {/* Bottom-left cube */}
                  <path d="M10 13.5 L16 17 L10 20.5 L4 17 Z" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M4 17 L10 20.5 L10 25.5 L4 22 Z" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 20.5 L16 17 L16 22 L10 25.5 Z" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />

                  {/* Bottom-right cube */}
                  <path d="M22 13.5 L28 17 L22 20.5 L16 17 Z" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M16 17 L22 20.5 L22 25.5 L16 22 Z" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M22 20.5 L28 17 L28 22 L22 25.5 Z" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>

                {/* Docs badge */}
                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 tracking-tight">
                  Docs
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                MCP for AI{" "}
                <span className="relative inline-block whitespace-nowrap">
                  Agents
                  {/* Green highlighter marker underline */}
                  <svg
                    className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-[104%] h-3 sm:h-3.5 text-emerald-300 dark:text-emerald-500/80 -z-10 pointer-events-none"
                    viewBox="0 0 100 16"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2,11 Q50,5 98,9"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-4 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {t("docs.mcpSubtitle")}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Content stack */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-20 space-y-10 sm:space-y-12">
          {/* Top Highlight Card: MCP for AI Agents */}
          <Reveal delay={0.16}>
            <div className="rounded-2xl sm:rounded-3xl border border-emerald-200/90 dark:border-emerald-800/40 bg-[#f6fcf8] dark:bg-emerald-950/20 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0 max-w-2xl">
                <div className="w-11 h-11 rounded-full bg-[#e3f8e7] dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                  <Icon
                    icon="lucide:zap"
                    className="w-5 h-5 fill-[#16a34a] text-[#16a34a] dark:fill-emerald-400 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t("docs.mcp")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("docs.mcpIntro")}
                  </p>
                </div>
              </div>

              {/* 3D Isometric Platform Graphic with BugSnap Bug */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center self-center md:self-auto relative">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg
                    className="w-full h-full drop-shadow-xs"
                    viewBox="0 0 160 140"
                    fill="none"
                    aria-hidden="true"
                  >
                    {/* Soft ambient shadow */}
                    <ellipse cx="80" cy="118" rx="50" ry="16" fill="#10b981" fillOpacity="0.15" />

                    {/* 3D Base Green Block */}
                    {/* Left face */}
                    <path
                      d="M32 75 C32 78 33 80 36 82 L76 102 C78 103 80 103 80 101 L80 116 C80 119 78 120 76 119 L36 99 C33 97 32 95 32 92 Z"
                      fill="#22c55e"
                    />
                    {/* Right face */}
                    <path
                      d="M80 101 C80 103 82 103 84 102 L124 82 C127 80 128 78 128 75 L128 92 C128 95 127 97 124 99 L84 119 C82 120 80 119 80 116 Z"
                      fill="#15803d"
                    />
                    {/* Top face */}
                    <path
                      d="M77 53 C79 52 81 52 83 53 L125 74 C127 75 127 77 125 78 L83 99 C81 100 79 100 77 99 L35 78 C33 77 33 75 35 74 Z"
                      fill="#4ade80"
                    />

                    {/* Floating Frosted Glass Slab */}
                    {/* Left thickness */}
                    <path
                      d="M36 49 L78 70 L78 76 L36 55 Z"
                      fill="rgba(255, 255, 255, 0.75)"
                    />
                    {/* Right thickness */}
                    <path
                      d="M82 70 L124 49 L124 55 L82 76 Z"
                      fill="rgba(209, 250, 229, 0.75)"
                    />
                    {/* Glass Top Face */}
                    <path
                      d="M77 28 C79 27 81 27 83 28 L125 49 C127 50 127 52 125 53 L83 74 C81 75 79 75 77 74 L35 53 C33 52 33 50 35 49 Z"
                      fill="rgba(255, 255, 255, 0.88)"
                      stroke="#86efac"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {/* Official BugSnap Bug Logo floating on top */}
                  <div className="absolute top-[23px] sm:top-[27px] left-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center pointer-events-none drop-shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/icon.svg"
                      alt=""
                      aria-hidden="true"
                      width={34}
                      height={34}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Step 1: Generate a BugSnap API key */}
          <Reveal delay={0.22}>
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-10 h-10 rounded-full bg-[#e8faea] dark:bg-emerald-950/70 text-slate-900 dark:text-white font-bold text-base flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                1
              </div>
              <div className="space-y-3 min-w-0 flex-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t("docs.mcpStep1Title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                    {t("docs.mcpStep1Desc")}
                  </p>
                </div>
                <div>
                  <Link
                    href="/settings?tab=integrations#bugsnap-api-keys"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#eef9f0] hover:bg-[#e4f6e7] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60 transition-colors shadow-2xs"
                  >
                    <span>{t("docs.mcpStep1Cta")}</span>
                    <Icon icon="lucide:external-link" className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Step 2: Connect your AI tool */}
          <Reveal delay={0.28}>
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-10 h-10 rounded-full bg-[#e8faea] dark:bg-emerald-950/70 text-slate-900 dark:text-white font-bold text-base flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                2
              </div>
              <div className="space-y-4 min-w-0 flex-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t("docs.mcpStep2Title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                    {t("docs.mcpStep2Desc")}
                  </p>
                </div>

                {/* 2x2 Grid of 4 Client Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 sm:p-5 flex flex-col justify-between space-y-3 min-w-0 shadow-2xs"
                    >
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2.5">
                          {client.id === "claude-code" ? (
                            <div className="w-5 h-5 rounded bg-black flex items-center justify-center text-emerald-400 text-[10px] font-mono font-bold shrink-0">
                              &gt;_
                            </div>
                          ) : client.id === "claude-desktop" ? (
                            <Icon
                              icon="lucide:sun"
                              className="w-5 h-5 text-amber-700 dark:text-amber-500 shrink-0"
                              aria-hidden="true"
                            />
                          ) : client.id === "cursor" ? (
                            <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center shrink-0">
                              <Icon icon="lucide:box" className="w-3.5 h-3.5" aria-hidden="true" />
                            </div>
                          ) : (
                            <Icon
                              icon="lucide:layers"
                              className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {client.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(mcpConfigJson, client.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors shadow-2xs shrink-0 touch-manipulation font-medium"
                        >
                          <Icon
                            icon={copiedKey === client.id ? "lucide:check" : "lucide:copy"}
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>
                            {copiedKey === client.id ? t("docs.terminalCopied") : t("docs.copyCode")}
                          </span>
                        </button>
                      </div>

                      {/* Code Block with Exact Syntax Highlight */}
                      <div className="font-mono text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 rounded-xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 p-3.5 overflow-x-auto min-w-0">
                        <pre className="leading-relaxed whitespace-pre font-mono">
                          <span className="text-slate-600 dark:text-slate-400">&#123;</span>
                          {"\n"}  <span className="text-slate-900 dark:text-slate-100 font-bold">&quot;mcpServers&quot;</span>: <span className="text-slate-600 dark:text-slate-400">&#123;</span>
                          {"\n"}    <span className="text-slate-900 dark:text-slate-100 font-bold">&quot;bugsnap&quot;</span>: <span className="text-slate-600 dark:text-slate-400">&#123;</span>
                          {"\n"}      <span className="text-slate-900 dark:text-slate-100 font-bold">&quot;command&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&quot;npx&quot;</span>,
                          {"\n"}      <span className="text-slate-900 dark:text-slate-100 font-bold">&quot;args&quot;</span>: <span className="text-slate-600 dark:text-slate-400">[</span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">&quot;-y&quot;</span>, <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&quot;@bugsnap/mcp&quot;</span><span className="text-slate-600 dark:text-slate-400">]</span>,
                          {"\n"}      <span className="text-slate-900 dark:text-slate-100 font-bold">&quot;env&quot;</span>: <span className="text-slate-600 dark:text-slate-400">&#123;</span>
                          {"\n"}        <span className="text-slate-900 dark:text-slate-100 font-bold">&quot;BUGSNAP_API_KEY&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&quot;your_api_key_here&quot;</span>
                          {"\n"}      <span className="text-slate-600 dark:text-slate-400">&#125;</span>
                          {"\n"}    <span className="text-slate-600 dark:text-slate-400">&#125;</span>
                          {"\n"}  <span className="text-slate-600 dark:text-slate-400">&#125;</span>
                          {"\n"}<span className="text-slate-600 dark:text-slate-400">&#125;</span>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Step 3: Ask your agent */}
          <Reveal delay={0.34}>
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-10 h-10 rounded-full bg-[#e8faea] dark:bg-emerald-950/70 text-slate-900 dark:text-white font-bold text-base flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                3
              </div>
              <div className="space-y-3 min-w-0 flex-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t("docs.mcpStep3Title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                    {t("docs.mcpStep3Desc")}
                  </p>
                </div>

                {/* Prompt Example Bubbles */}
                <div className="space-y-2.5 pt-1">
                  <div className="rounded-xl sm:rounded-2xl bg-[#f4f7fa] dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800/40 px-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-3 shadow-2xs">
                    <Icon
                      icon="lucide:message-square"
                      className="w-4 h-4 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-semibold">
                      &ldquo;{t("docs.mcpPrompt1")}&rdquo;
                    </span>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl bg-[#f4f7fa] dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800/40 px-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-3 shadow-2xs">
                    <Icon
                      icon="lucide:message-square"
                      className="w-4 h-4 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-semibold">
                      &ldquo;{t("docs.mcpPrompt2")}&rdquo;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Available Tools Card */}
          <Reveal delay={0.4}>
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#e8faea] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M16 3 L22 6.5 L16 10 L10 6.5 Z" fill="#dcfce7" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M10 6.5 L16 10 L16 15 L10 11.5 Z" fill="#bbf7d0" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M16 10 L22 6.5 L22 11.5 L16 15 Z" fill="#86efac" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M10 13.5 L16 17 L10 20.5 L4 17 Z" fill="#dcfce7" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M4 17 L10 20.5 L10 25.5 L4 22 Z" fill="#bbf7d0" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M10 20.5 L16 17 L16 22 L10 25.5 Z" fill="#86efac" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M22 13.5 L28 17 L22 20.5 L16 17 Z" fill="#dcfce7" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M16 17 L22 20.5 L22 25.5 L16 22 Z" fill="#bbf7d0" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M22 20.5 L28 17 L28 22 L22 25.5 Z" fill="#86efac" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t("docs.mcpToolsTitle")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t("docs.mcpToolsDesc")}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 pt-1">
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0">
                  <span className="px-3 py-1 rounded-md text-xs sm:text-sm font-mono font-bold bg-[#eaf8ed] dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 w-fit shrink-0">
                    {t("docs.mcpTool1Name")}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-w-0">
                    {t("docs.mcpTool1Desc")}
                  </p>
                </div>
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0">
                  <span className="px-3 py-1 rounded-md text-xs sm:text-sm font-mono font-bold bg-[#eaf8ed] dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 w-fit shrink-0">
                    {t("docs.mcpTool2Name")}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-w-0">
                    {t("docs.mcpTool2Desc")}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Test it without an AI client Card */}
          <Reveal delay={0.46}>
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#e8faea] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                  <Icon
                    icon="lucide:play"
                    className="w-4 h-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400 ml-0.5"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t("docs.mcpTestTitle")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t("docs.mcpTestDesc")}
                  </p>
                </div>
              </div>

              {/* Terminal Command Bar */}
              <div className="rounded-xl sm:rounded-2xl bg-[#f4f7fa] dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800/40 p-3.5 sm:p-4 flex items-center justify-between gap-4 font-mono text-xs sm:text-sm overflow-x-auto">
                <span className="font-semibold text-slate-900 dark:text-white select-all whitespace-nowrap min-w-0">
                  {testCommand}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(testCommand, "test-cmd")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors shadow-2xs shrink-0 touch-manipulation"
                >
                  <Icon
                    icon={copiedKey === "test-cmd" ? "lucide:check" : "lucide:copy"}
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  />
                  <span>
                    {copiedKey === "test-cmd" ? t("docs.terminalCopied") : t("docs.copyCode")}
                  </span>
                </button>
              </div>
            </div>
          </Reveal>

          {/* Bottom Reference Links */}
          <Reveal delay={0.52}>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline transition-colors"
              >
                <Icon icon="lucide:sparkles" className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{t("docs.mcpExploreDoc")}</span>
                <Icon icon="lucide:external-link" className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </Link>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">|</span>
              <Link
                href="/settings?tab=integrations#bugsnap-api-keys"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline transition-colors"
              >
                <Icon icon="lucide:code-2" className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{t("docs.mcpApiRef")}</span>
                <Icon icon="lucide:external-link" className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
