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

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HowItWorksContent() {
  const { t } = useT();

  const steps = [
    {
      num: "01",
      badge: "Step 1 · Capture",
      icon: IconCamera,
      title: t("howItWorks.step1Title") || "Capture Your Screen in One Click",
      desc:
        t("howItWorks.step1Desc") ||
        "Press Ctrl+Shift+S for screenshots or Ctrl+Shift+F for video. Choose full screen, an application window, or a single Chrome tab. Annotate with arrows, boxes, text, and blur tools before saving.",
      points: [
        "Record crisp HD video with microphone voice narration",
        "Select area, visible screen, or full-page scrolling screenshots",
        "Built-in blur tool automatically obscures sensitive passwords",
      ],
      mockup: <HotkeyCommandBar />,
    },
    {
      num: "02",
      badge: "Step 2 · Diagnose",
      icon: IconTerminal2,
      title: t("howItWorks.step2Title") || "DevTools Context Captured Automatically",
      desc:
        t("howItWorks.step2Desc") ||
        "BugSnap runs silently in the background of your active tab. It records every unhandled JavaScript error, 4xx/5xx network failure, and system specification — zero configuration required.",
      points: [
        "Full stack traces for unhandled exceptions",
        "Failed network requests with request & response headers",
        "Device info: OS, browser version, screen resolution, viewport",
      ],
      mockup: <DevToolsCard />,
    },
    {
      num: "03",
      badge: "Step 3 · Share",
      icon: IconShare,
      title: t("howItWorks.step3Title") || "Saved in Your Drive. Shared in 1 Link.",
      desc:
        t("howItWorks.step3Desc") ||
        "Files upload straight to your Google Drive account. BugSnap creates an interactive share link with video player, synchronized log console, and copy-ready Markdown bug templates for Jira & Linear.",
      points: [
        "100% data ownership: files never touch our servers",
        "Teammates can view and inspect without installing anything",
        "One-click copy to Jira, Linear, GitHub Issues, or Slack",
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
        "From Click to Fix in 3 simple steps. No complex setup, no server lock-in."
      }
    >
      <div className="space-y-16">
        {/* Step-by-Step Flow */}
        <div className="space-y-12">
          {steps.map((st, i) => (
            <Reveal key={st.num} delay={i * 0.08}>
              <div
                className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 shadow-sm"
              >
                <div
                  className={`lg:col-span-6 space-y-4 ${
                    i % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-site-accent">
                      {st.num}
                    </span>
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
                  {st.mockup}
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
                Start Now
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-site-text tracking-tight">
                Try it on your next bug
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                Free. Installs to Chrome in 10 seconds.
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
