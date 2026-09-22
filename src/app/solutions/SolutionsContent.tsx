"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { DevToolsCard, GoogleDriveProofCard, ExportTicketCard } from "@/components/site/ProductMockups";
import { BrowserFrame } from "@/components/site/BrowserFrame";
import { IconCheck } from "@/components/site/TablerIcons";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SolutionsContent() {
  const { t } = useT();

  const useCases = [
    {
      role: t("solutions.qa.title"),
      badge: "Quality Assurance",
      headline: t("solutions.qa.role"),
      desc: t("solutions.qa.desc"),
      points: [
        "1-click recording with hotkeys (Ctrl+Shift+S / Ctrl+Shift+F)",
        "Automatic capture of console errors and failed network calls",
        "Reduces time spent writing step-by-step reproduction instructions",
      ],
      mockup: <DevToolsCard />,
    },
    {
      role: t("solutions.dev.title"),
      badge: "Engineering",
      headline: t("solutions.dev.role"),
      desc: t("solutions.dev.desc"),
      points: [
        "Full unhandled JS exceptions with complete stack traces",
        "Exact HTTP status codes, request bodies, and headers",
        "Copy curl commands directly to reproduce in terminal",
      ],
      mockup: <ExportTicketCard />,
    },
    {
      role: t("solutions.pm.title"),
      badge: "Product Management",
      headline: t("solutions.pm.role"),
      desc: t("solutions.pm.desc"),
      points: [
        "On-screen callouts, arrows, and step numbers",
        "Interactive web links that open directly in Linear and Jira",
        "Private Google Drive links without video file upload limits",
      ],
      mockup: (
        <BrowserFrame url="https://staging.acme.corp/billing">
          <div className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle">
              <span className="font-semibold text-site-text">Checkout Review Modal</span>
              <span className="text-[10px] text-accent font-medium">PM Callout</span>
            </div>
            <div className="p-2 rounded border border-red-500/30 bg-red-500/5 text-site-text">
              <span className="text-red-500 font-bold">↳ Bug: </span>
              Discount code input field submits form prematurely on Enter key
            </div>
          </div>
        </BrowserFrame>
      ),
    },
    {
      role: t("solutions.support.title"),
      badge: "Customer Support",
      headline: t("solutions.support.role"),
      desc: t("solutions.support.desc"),
      points: [
        "Zero extension or account requirement for end users to view reports",
        "Silent diagnostic telemetry collection without technical friction",
        "Secure credential redaction protects customer PII",
      ],
      mockup: <GoogleDriveProofCard />,
    },
  ];

  return (
    <StaticShell
      title={t("solutions.title")}
      subtitle={t("solutions.subtitle")}
    >
      <div className="space-y-16">
        {/* Solutions Grid */}
        <div className="space-y-12">
          {useCases.map((uc, i) => (
            <div
              key={uc.role}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-xl border border-site-border bg-site-surface ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className={`lg:col-span-7 space-y-4 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-site-surface-2 text-site-text-2 border border-site-border-subtle">
                  {uc.badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-site-text tracking-tight">
                  {uc.headline}
                </h2>
                <p className="text-sm text-site-text-2 leading-relaxed">
                  {uc.desc}
                </p>
                <ul className="space-y-2 pt-2 text-xs text-site-text">
                  {uc.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <IconCheck size={14} className="text-accent mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                {uc.mockup}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-xl border border-site-border bg-site-surface p-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-site-text">
            Equip your entire team with BugSnap
          </h3>
          <p className="text-xs text-site-text-2 max-w-md mx-auto">
            Free forever with direct Google Drive storage. No credit card required.
          </p>
          <div className="pt-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-slate-900 text-xs font-semibold hover:bg-accent-hover hover:text-white transition-all shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
              <span>Add to Chrome - Free</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
