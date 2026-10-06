"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import {
  DevToolsCard,
  GoogleDriveProofCard,
  ExportTicketCard,
} from "@/components/site/ProductMockups";
import { BrowserFrame } from "@/components/site/BrowserFrame";
import { RoleSwitcher } from "@/components/site/RoleSwitcher";
import { IconCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SolutionsContent() {
  const { t } = useT();

  const useCases = [
    {
      role: t("solutions.qa.title") || "For QA Engineers",
      badge: "Quality Assurance",
      headline: t("solutions.qa.role") || "Capture visual bugs + silent console errors in one go",
      desc:
        t("solutions.qa.desc") ||
        "Stop writing 5-paragraph bug descriptions. Record a 30-second screen capture with voice narration, and BugSnap automatically attaches all console warnings, unhandled exceptions, and failed network calls.",
      points: [
        t("solutions.qa.point1") || "Automatic network log capture for HTTP 4xx & 5xx responses",
        t("solutions.qa.point2") || "Built-in blur tool protects passwords and customer PII",
        t("solutions.qa.point3") || "Timestamped notes pinpoint the exact second a bug occurred",
      ],
      mockup: <DevToolsCard />,
    },
    {
      role: t("solutions.dev.title") || "For Software Engineers",
      badge: "Engineering",
      headline: t("solutions.dev.role") || "Everything you need to reproduce and fix immediately",
      desc:
        t("solutions.dev.desc") ||
        "No more 'works on my machine'. Every BugSnap link gives you a synchronized video timeline, DevTools console error logs, network request waterfalls, and exact environment specs.",
      points: [
        t("solutions.dev.point1") || "Copy-ready cURL commands and Markdown bug templates",
        t("solutions.dev.point2") || "Inspect exact browser version, OS, screen scale, and memory",
        t("solutions.dev.point3") || "AI Clue automatically highlights root cause from error traces",
      ],
      mockup: <ExportTicketCard />,
    },
    {
      role: t("solutions.pm.title") || "For Product Managers",
      badge: "Product Management",
      headline: t("solutions.pm.role") || "Review staging releases and leave visual feedback",
      desc:
        t("solutions.pm.desc") ||
        "Record user flows on staging builds and annotate UI flaws with arrows and text boxes. Share feedback links with engineering without opening a Jira ticket for every typo.",
      points: [
        t("solutions.pm.point1") || "Annotate screenshots with arrows, text, and numbered steps",
        t("solutions.pm.point2") || "Organize captures in project folders by release or sprint",
        t("solutions.pm.point3") || "Team workspace sharing with seat management",
      ],
      mockup: (
        <BrowserFrame url="https://staging.acme.corp/checkout">
          <div className="p-4 space-y-3 text-xs bg-site-surface">
            <div className="flex items-center justify-between pb-2 border-b border-site-border">
              <span className="font-semibold text-site-text">Checkout Review Flow</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-site-accent/10 text-site-accent font-semibold">
                PM Callout
              </span>
            </div>
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-site-text space-y-1">
              <div className="text-red-500 font-bold flex items-center gap-1.5">
                <span>↳ Step 3 Bug:</span>
              </div>
              <p className="text-site-text-2 text-[11px]">
                Discount code field submits form prematurely on Enter key instead of applying coupon.
              </p>
            </div>
          </div>
        </BrowserFrame>
      ),
    },
    {
      role: t("solutions.support.title") || "For Customer Support",
      badge: "Customer Support",
      headline: t("solutions.support.role") || "Turn customer bug reports into actionable dev tickets",
      desc:
        t("solutions.support.desc") ||
        "Have customers record their issue with BugSnap or record user sessions yourself. Escalate tickets to engineering with full technical context already attached.",
      points: [
        t("solutions.support.point1") || "No client installation needed for viewing bug reports",
        t("solutions.support.point2") || "All files stored directly in your company Google Drive",
        t("solutions.support.point3") || "Shareable links with optional password protection",
      ],
      mockup: <GoogleDriveProofCard />,
    },
  ];

  return (
    <StaticShell
      breadcrumb={t("site.nav.solutions") || "Solutions"}
      title={t("solutions.title") || "Solutions"}
      subtitle={
        t("solutions.subtitle") ||
        "Built for the entire product team — QA, Engineering, Product, and Support."
      }
    >
      <div className="space-y-16">
        {/* Interactive Role Switcher from Landing */}
        <div className="py-4">
          <RoleSwitcher />
        </div>

        {/* Detailed Solutions Cards */}
        <div className="space-y-12">
          {useCases.map((uc, i) => (
            <Reveal key={uc.role} delay={i * 0.08}>
              <div
                className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 shadow-sm"
              >
                <div
                  className={`lg:col-span-6 space-y-4 ${
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
                        <IconCheck size={16} className="text-site-accent mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`lg:col-span-6 ${
                    i % 2 === 1 ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {uc.mockup}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <Reveal delay={0.3}>
          <div className="relative overflow-hidden rounded-3xl border border-site-border bg-gradient-to-br from-site-surface via-site-surface to-site-surface-2 p-8 sm:p-14 text-center shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-40"
              style={{
                background: "radial-gradient(ellipse 70% 60% at 50% -10%, var(--glow-primary), transparent 70%)",
              }}
            />
            <div className="relative z-10 space-y-4 max-w-xl mx-auto">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-site-accent px-3 py-1 rounded-full bg-site-accent/10 border border-site-accent/20">
                Ready to Ship Faster?
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-site-text tracking-tight">
                Empower your whole team with BugSnap
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                Free. Saves directly to your team&apos;s Google Drive. No server lock-in.
              </p>
              <div className="pt-3">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
                  <span>Add to Chrome - Free</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
