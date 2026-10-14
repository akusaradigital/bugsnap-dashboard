"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { IconCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SolutionsContent() {
  const { t } = useT();

  const useCases = [
    {
      role: t("solutions.qa.title") || "For QA Engineers",
      badge: t("solutions.qa.badge") || "Quality Assurance",
      headline: t("solutions.qa.role") || "Capture visual bugs + silent console errors in one go",
      desc:
        t("solutions.qa.desc") ||
        "Stop writing 5-paragraph bug descriptions. Record a 30-second screen capture with voice narration, and BugSnap automatically attaches all console warnings, unhandled exceptions, and failed network calls.",
      points: [
        t("solutions.qa.point1") || "Automatic network log capture for HTTP 4xx & 5xx responses",
        t("solutions.qa.point2") || "Built-in blur tool protects passwords and customer PII",
        t("solutions.qa.point3") || "Timestamped notes pinpoint the exact second a bug occurred",
      ],
      mockup: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle font-sans">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-xs text-site-text">QA Step & Audio Log</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Sync to Jira / Linear
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="p-2.5 rounded bg-site-surface border border-site-border text-site-text space-y-1">
              <div className="flex items-center justify-between text-site-text-2 text-[10px]">
                <span className="text-site-accent font-semibold font-sans">Step 1 (00:04)</span>
                <span>input#billing-promo</span>
              </div>
              <div className="text-site-text font-semibold">User typed &quot;SUMMER50&quot;</div>
            </div>
            <div className="p-2.5 rounded bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold font-sans">Step 2 (00:12) - Exception</span>
                <span className="font-bold">HTTP 504 Timeout</span>
              </div>
              <div className="text-[10px] break-all">POST /api/v1/promotions/apply &rarr; Gateway Timeout</div>
            </div>
            <div className="p-2 rounded bg-site-surface border border-site-border-subtle flex items-center justify-between text-[10px] text-site-text-2">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:mic" className="w-3 h-3 text-site-accent" />
                <span>Voice narration synced</span>
              </span>
              <span className="text-site-accent font-semibold">00:24 Total</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      role: t("solutions.dev.title") || "For Software Engineers",
      badge: t("solutions.dev.badge") || "Engineering",
      headline: t("solutions.dev.role") || "Everything you need to reproduce and fix immediately",
      desc:
        t("solutions.dev.desc") ||
        "No more 'works on my machine'. Every BugSnap link gives you a synchronized video timeline, DevTools console error logs, network request waterfalls, and exact environment specs.",
      points: [
        t("solutions.dev.point1") || "Copy-ready cURL commands and Markdown bug templates",
        t("solutions.dev.point2") || "Inspect exact browser version, OS, screen scale, and memory",
        t("solutions.dev.point3") || "AI Clue automatically isolates root cause and call stack",
      ],
      mockup: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-mono shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle font-sans">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:terminal" className="w-3.5 h-3.5 text-site-accent" />
              <span className="font-semibold text-xs text-site-text">Developer Debug Console</span>
            </div>
            <span className="text-[10px] text-site-accent font-bold bg-site-accent/10 px-2 py-0.5 rounded">
              cURL Ready
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text">
              <span className="text-site-accent font-bold">Stack: </span>
              <span className="text-red-500 font-semibold break-all">TypeError: checkoutSession is undefined</span>
              <div className="text-[10px] text-site-text-2 mt-0.5">at submitPayment (flow.ts:148:19)</div>
            </div>
            <div className="p-2 rounded bg-site-surface border border-site-border text-site-text-2 flex items-center justify-between text-[10px]">
              <span>Specs: Chrome 129 / macOS 15.1 (DPR 2.0)</span>
              <span className="text-emerald-500 font-semibold">100% Repro</span>
            </div>
            <div className="p-2 rounded bg-site-surface-2 border border-site-border-subtle flex items-center justify-between text-[10px]">
              <span className="truncate text-site-text-2">curl -X POST &apos;https://app.../api/charge&apos; -H ...</span>
              <button
                type="button"
                className="shrink-0 text-site-accent hover:underline text-[10px] font-bold ml-2"
                onClick={() => navigator.clipboard?.writeText("curl -X POST https://app.acme.corp/api/charge")}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      role: t("solutions.pm.title") || "For Product Managers",
      badge: t("solutions.pm.badge") || "Product Management",
      headline: t("solutions.pm.role") || "Review release blockers with visual clarity and precision",
      desc:
        t("solutions.pm.desc") ||
        "Highlight UX inconsistencies and acceptance criteria failures directly on the screen. Share annotated captures into Linear, Jira, or Slack without scheduling alignment calls.",
      points: [
        t("solutions.pm.point1") || "On-screen callouts, arrows, and visual markers",
        t("solutions.pm.point2") || "Direct issue creation in Jira, Linear, and GitHub",
        t("solutions.pm.point3") || "Zero sign-up required for stakeholders to watch recordings",
      ],
      mockup: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-site shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:check-square" className="w-3.5 h-3.5 text-site-accent" />
              <span className="font-semibold text-xs text-site-text">Release Acceptance Review</span>
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              P1 Blocker
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="p-2.5 rounded bg-site-surface border border-site-border space-y-1">
              <div className="font-semibold text-site-text">Expected: Cart discounts apply automatically</div>
              <div className="text-site-text-2 text-[10px]">Actual: Button disabled state freezes without validation error banner</div>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-site-surface border border-site-border-subtle text-[10px] text-site-text-2">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:tag" className="w-3 h-3 text-site-accent" />
                <span>Tagged: #Checkout-Revamp-v2</span>
              </span>
              <span className="text-site-accent font-semibold">Linear ENG-4829</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      role: t("solutions.support.title") || "For Customer Support Teams",
      badge: t("solutions.support.badge") || "Customer Support",
      headline: t("solutions.support.role") || "Escalate user bugs with instant technical proof",
      desc:
        t("solutions.support.desc") ||
        "Gather technical reproduction data silently in the background. Stop asking users for screenshots, browser versions, or console logs.",
      points: [
        t("solutions.support.point1") || "Background diagnostic capture without asking users for DevTools",
        t("solutions.support.point2") || "Export complete ticket summaries directly to helpdesk systems",
        t("solutions.support.point3") || "One share link contains recording, logs, and network details",
      ],
      mockup: (
        <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-xs font-site shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-site-border-subtle">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:headphones" className="w-3.5 h-3.5 text-site-accent" />
              <span className="font-semibold text-xs text-site-text">Customer Escalation Ticket</span>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              Zendesk / Intercom
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="p-2.5 rounded bg-site-surface border border-site-border space-y-1">
              <div className="flex items-center justify-between text-[10px] text-site-text-2">
                <span>Customer: Tier 3 Enterprise Account</span>
                <span className="text-emerald-500 font-semibold font-mono">No Install Needed</span>
              </div>
              <div className="text-site-text font-semibold">User cannot submit VAT tax exemption form</div>
            </div>
            <div className="p-2 rounded bg-site-surface-2 border border-site-border-subtle flex items-center justify-between text-[10px] text-site-text-2">
              <span>Auto-attached: Windows 11 · Edge 128 · 1 Console Error</span>
              <span className="text-site-accent font-semibold">Ready for Eng</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <StaticShell
      breadcrumb={t("site.nav.solutions") || "Solutions"}
      title={t("solutions.title") || "Clarity for every role in the debugging loop"}
      subtitle={
        t("solutions.subtitle") ||
        "From initial discovery to root-cause fix, BugSnap removes the friction between QA, engineering, product, and support."
      }
    >
      <div className="space-y-16">
        {/* Role-Specific Solutions Grid */}
        <div className="space-y-10">
          {useCases.map((uc, i) => (
            <Reveal key={uc.role} delay={i * 0.08}>
              <div
                className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-4 sm:p-8 rounded-2xl border border-site-border bg-site-surface shadow-sm"
              >
                <div
                  className={`lg:col-span-6 min-w-0 space-y-4 ${
                    i % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-site-accent/10 text-site-accent border border-site-accent/20">
                    {uc.badge}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
                    {uc.headline}
                  </h2>
                  <p className="text-sm text-site-text-2 leading-relaxed">
                    {uc.desc}
                  </p>
                  <ul className="space-y-2 pt-2 text-xs sm:text-sm text-site-text">
                    {uc.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`lg:col-span-6 min-w-0 ${
                    i % 2 === 1 ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {uc.mockup}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Contextual Solutions CTA */}
        <Reveal delay={0.3}>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface p-6 sm:p-8 lg:p-10 shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-40"
              style={{
                background: "radial-gradient(ellipse 70% 60% at 50% -10%, var(--glow-primary), transparent 70%)",
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-w-0">
              <div className="space-y-1.5 text-left min-w-0 flex-1">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-site-accent">
                  {t("solutions.ctaEyebrow") || "Team Collaboration"}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                  {t("solutions.ctaTitle") || "Equip your whole team with BugSnap"}
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                  {t("solutions.ctaDesc") || "Free forever. Files stream straight to your Google Drive. Zero server data retention."}
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99] touch-manipulation whitespace-nowrap"
                >
                  <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t("features.ctaButton") || "Add to Chrome - Free"}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
