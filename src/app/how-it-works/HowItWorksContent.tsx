"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HowItWorksContent() {
  const { t } = useT();

  const steps = [
    {
      num: "01",
      badge: "Capture",
      title: t("howItWorks.step1Title"),
      desc: t("howItWorks.step1Desc"),
      items: [
        { label: t("landing.screenRecorder"), detail: "Ctrl + Shift + S" },
        { label: t("landing.devTools"), detail: "Ctrl + Shift + F" },
      ],
    },
    {
      num: "02",
      badge: "Diagnose",
      title: t("howItWorks.step2Title"),
      desc: t("howItWorks.step2Desc"),
      items: [
        { label: t("howItWorks.preview2Console"), detail: "Console Error" },
        { label: t("howItWorks.preview2Network"), detail: "Network 500" },
      ],
    },
    {
      num: "03",
      badge: "Resolve",
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
        {/* 3 Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-site-border bg-site-surface p-6 flex flex-col justify-between space-y-6 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent">
                    Step {step.num}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-site-text-2 bg-site-surface-2 px-2 py-0.5 rounded">
                    {step.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-site-text">
                  {step.title}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="rounded-lg border border-site-border bg-site-surface-2 p-3 space-y-2 font-mono text-xs">
                {step.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-site-text">
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
          ))}
        </div>

        {/* CTA Banner */}
        <div className="rounded-xl border border-site-border bg-site-surface p-8 text-center space-y-4 shadow-xs">
          <h2 className="text-xl font-bold text-site-text">
            {t("footer.captureBugsFaster")}
          </h2>
          <p className="text-xs text-site-text-2 max-w-lg mx-auto leading-relaxed">
            {t("footer.captureDesc")}
          </p>
          <div className="pt-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 hover:text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>{t("footer.addToChrome")}</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
