"use client";

import { motion } from "motion/react";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { IconCamera, IconTerminal2, IconShare } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HowItWorksContent() {
  const { t } = useT();

  const steps = [
    {
      id: "capture",
      badge: "Capture",
      icon: IconCamera,
      title: t("howItWorks.step1Title"),
      desc: t("howItWorks.step1Desc"),
      items: [
        { label: t("landing.screenRecorder"), detail: "Ctrl + Shift + S" },
        { label: t("landing.devTools"), detail: "Ctrl + Shift + F" },
      ],
    },
    {
      id: "diagnose",
      badge: "Diagnose",
      icon: IconTerminal2,
      title: t("howItWorks.step2Title"),
      desc: t("howItWorks.step2Desc"),
      items: [
        { label: t("howItWorks.preview2Console"), detail: "Console Error" },
        { label: t("howItWorks.preview2Network"), detail: "Network 500" },
      ],
    },
    {
      id: "resolve",
      badge: "Resolve",
      icon: IconShare,
      title: t("howItWorks.step3Title"),
      desc: t("howItWorks.step3Desc"),
      items: [
        { label: t("howItWorks.preview3Drive"), detail: "Google Drive" },
        { label: t("howItWorks.preview3Share"), detail: "Instant Share Link" },
      ],
    },
  ];

  return (
    <StaticShell
      title={t("howItWorks.title")}
      subtitle={t("howItWorks.subtitle")}
    >
      <div className="space-y-12">
        {/* 3 Step Process Grid with Connecting Rail */}
        <div className="relative">
          {/* Animated Connecting Rail across the 3 cards on desktop */}
          <div
            className="hidden md:block absolute top-11 left-12 right-12 border-t border-dashed border-site-border pointer-events-none z-0"
            aria-hidden="true"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="border-t border-dashed border-accent origin-left -mt-[1px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.id} delay={i * 0.12} className="h-full">
                  <div className="relative overflow-hidden group h-full rounded-xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/70 p-6 flex flex-col justify-between space-y-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10">
                    {/* Top edge gradient accent */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

                    <div className="space-y-4">
                      {/* Action Icon Node & Semantic Badge Pill (No Numbers!) */}
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 via-emerald-500/10 to-transparent border border-accent/30 flex items-center justify-center text-accent shadow-xs group-hover:scale-105 group-hover:shadow-md group-hover:shadow-accent/20 transition-all duration-300">
                          <Icon size={20} strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-site-text-2 bg-site-surface-2 px-2.5 py-1 rounded-md border border-site-border-subtle">
                          {step.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-site-text group-hover:text-accent transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    <div className="rounded-lg border border-site-border bg-site-surface-2 p-3 space-y-2 font-mono text-xs">
                      {step.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center justify-between text-[11px] text-site-text">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <span className="truncate">{item.label}</span>
                          </span>
                          <span className="text-[10px] text-site-text-2 bg-site-surface px-1.5 py-0.5 rounded border border-site-border-subtle">
                            {item.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <Reveal delay={0.3}>
          <div className="relative overflow-hidden rounded-2xl border border-site-border bg-site-surface/85 backdrop-blur-md p-8 sm:p-12 text-center space-y-4 shadow-lg">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-site-surface-2 border border-site-border text-accent shadow-xs mb-1" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" className="w-6 h-6 object-contain" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-site-text tracking-tight">
                {t("footer.captureBugsFaster")}
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2 max-w-lg mx-auto leading-relaxed">
                {t("footer.captureDesc")}
              </p>
              <div className="pt-2">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 text-xs font-semibold shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
                  <span>{t("footer.addToChrome")}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
