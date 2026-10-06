"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { HotkeyCommandBar } from "@/components/site/HotkeyCommandBar";
import { DevToolsCard, GoogleDriveProofCard } from "@/components/site/ProductMockups";
import { IconCamera, IconWorld, IconDatabase } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function ExtensionContent() {
  const { t } = useT();

  const capabilities = [
    {
      title: t("extension.f1Title") || "Screen Recording & HD Screenshots",
      desc:
        t("extension.f1Desc") ||
        "Capture full monitors, individual application windows, or active Chrome tabs. Annotate with arrows, shapes, text, and automated password blur.",
      badge: "Fast Capture",
      icon: <IconCamera size={18} className="text-site-accent" />,
      mockup: <HotkeyCommandBar />,
    },
    {
      title: t("extension.f2Title") || "Automated Console & Network Telemetry",
      desc:
        t("extension.f2Desc") ||
        "The extension silently intercepts console exceptions and HTTP 4xx/5xx network errors from the active tab. No manual DevTools copy-pasting.",
      badge: "Silent Diagnostics",
      icon: <IconWorld size={18} className="text-site-accent" />,
      mockup: <DevToolsCard />,
    },
    {
      title: t("extension.f3Title") || "Direct Google Drive Upload Bridge",
      desc:
        t("extension.f3Desc") ||
        "Captures upload straight to your Google Drive account using Google OAuth. Generate shareable view links in seconds without server lock-in.",
      badge: "Data Sovereignty",
      icon: <IconDatabase size={18} className="text-site-accent" />,
      mockup: <GoogleDriveProofCard />,
    },
  ];

  return (
    <StaticShell
      title={t("extension.title") || "BugSnap Chrome Extension"}
      subtitle={
        t("extension.subtitle") ||
        "The developer-friendly screen recorder and bug reporting tool that saves directly to your Google Drive."
      }
    >
      <div className="space-y-16">
        {/* Feature Sections */}
        <div className="space-y-12">
          {capabilities.map((cap, i) => (
            <Reveal key={cap.title} delay={i * 0.1}>
              <div
                className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 shadow-sm"
              >
                <div
                  className={`lg:col-span-6 space-y-4 ${
                    i % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-site-accent/10 border border-site-accent/20">
                      {cap.icon}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-site-accent">
                      {cap.badge}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
                    {cap.title}
                  </h2>
                  <p className="text-sm text-site-text-2 leading-relaxed">
                    {cap.desc}
                  </p>

                  <div className="pt-2">
                    <a
                      href={CHROME_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-site-accent hover:underline"
                    >
                      <span>Install extension</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>

                <div
                  className={`lg:col-span-6 ${
                    i % 2 === 1 ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {cap.mockup}
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
                Install in 10 Seconds
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-site-text tracking-tight">
                Add BugSnap to your Chrome browser
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                Free · Direct Google Drive sync · Zero configuration
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
