"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import {
  DevToolsCard,
  GoogleDriveProofCard,
} from "@/components/site/ProductMockups";
import { HotkeyCommandBar } from "@/components/site/HotkeyCommandBar";
import { IconCamera, IconTerminal2, IconShare, IconCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HowItWorksContent() {
  const { t } = useT();

  const steps = [
    {
      id: "capture",
      badge: t("howItWorks.badgeStep1") || "Capture",
      icon: IconCamera,
      title: t("howItWorks.step1Title") || "Capture Your Screen in One Click",
      desc:
        t("howItWorks.step1Desc") ||
        "Press Ctrl+Shift+S for screenshots or Ctrl+Shift+F for video. Choose full screen, an application window, or a single Chrome tab. Annotate with arrows, boxes, text, and blur tools before saving.",
      points: [
        t("howItWorks.step1Point1") || "Record crisp HD video with microphone voice narration",
        t("howItWorks.step1Point2") || "Select area, visible screen, or full-page scrolling screenshots",
        t("howItWorks.step1Point3") || "Built-in blur tool automatically obscures sensitive passwords",
      ],
      mockup: <HotkeyCommandBar />,
    },
    {
      id: "diagnose",
      badge: t("howItWorks.badgeStep2") || "Diagnose",
      icon: IconTerminal2,
      title: t("howItWorks.step2Title") || "DevTools Context Captured Automatically",
      desc:
        t("howItWorks.step2Desc") ||
        "BugSnap runs silently in the background of your active tab. It records every unhandled JavaScript error, 4xx/5xx network failure, and system specification with zero configuration required.",
      points: [
        t("howItWorks.step2Point1") || "Full stack traces for unhandled exceptions",
        t("howItWorks.step2Point2") || "Failed network requests with request & response headers",
        t("howItWorks.step2Point3") || "Device info: OS, browser version, screen resolution, viewport",
      ],
      mockup: <DevToolsCard />,
    },
    {
      id: "share",
      badge: t("howItWorks.badgeStep3") || "Share",
      icon: IconShare,
      title: t("howItWorks.step3Title") || "Saved in Your Drive. Shared in 1 Link.",
      desc:
        t("howItWorks.step3Desc") ||
        "Files upload straight to your Google Drive account. BugSnap creates an interactive share link with video player, synchronized log console, and copy-ready Markdown bug templates for Jira & Linear.",
      points: [
        t("howItWorks.step3Point1") || "100% data ownership: files never touch our servers",
        t("howItWorks.step3Point2") || "Teammates can view and inspect without installing anything",
        t("howItWorks.step3Point3") || "One-click copy to Jira, Linear, GitHub Issues, or Slack",
      ],
      mockup: <GoogleDriveProofCard />,
    },
  ];

  return (
    <StaticShell
      breadcrumb={t("site.nav.howItWorks") || "How it works"}
      title={t("howItWorks.title") || "How BugSnap Works"}
      subtitle={
        t("howItWorks.subtitle") ||
        "From click to fix without complex setup or server lock-in."
      }
    >
      <div className="space-y-16">
        {/* Step-by-Step Flow */}
        <div className="space-y-12">
          {steps.map((st, i) => (
            <Reveal key={st.id} delay={i * 0.08}>
              <div
                className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-4 sm:p-8 rounded-2xl border border-site-border bg-site-surface shadow-sm"
              >
                <div
                  className={`lg:col-span-6 min-w-0 space-y-4 ${
                    i % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-site-accent/10 text-site-accent border border-site-accent/20">
                      {st.badge}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
                    {st.title}
                  </h2>
                  <p className="text-sm text-site-text-2 leading-relaxed">
                    {st.desc}
                  </p>

                  <ul className="space-y-2 pt-2 text-xs sm:text-sm text-site-text">
                    {st.points.map((pt) => (
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
                  {st.mockup}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
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
                  {t("howItWorks.ctaEyebrow") || "Start Now"}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                  {t("howItWorks.ctaTitle") || "Try it on your next bug"}
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                  {t("howItWorks.ctaDesc") || "Free. Installs to Chrome in 10 seconds."}
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
