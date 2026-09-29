"use client";

import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { DevToolsCard, GoogleDriveProofCard, ExportTicketCard } from "@/components/site/ProductMockups";
import { BrowserFrame } from "@/components/site/BrowserFrame";
import { IconCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

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
        t("solutions.qa.point1"),
        t("solutions.qa.point2"),
        t("solutions.qa.point3"),
      ],
      mockup: <DevToolsCard />,
    },
    {
      role: t("solutions.dev.title"),
      badge: "Engineering",
      headline: t("solutions.dev.role"),
      desc: t("solutions.dev.desc"),
      points: [
        t("solutions.dev.point1"),
        t("solutions.dev.point2"),
        t("solutions.dev.point3"),
      ],
      mockup: <ExportTicketCard />,
    },
    {
      role: t("solutions.pm.title"),
      badge: "Product Management",
      headline: t("solutions.pm.role"),
      desc: t("solutions.pm.desc"),
      points: [
        t("solutions.pm.point1"),
        t("solutions.pm.point2"),
        t("solutions.pm.point3"),
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
        t("solutions.support.point1"),
        t("solutions.support.point2"),
        t("solutions.support.point3"),
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
            <Reveal key={uc.role} delay={i * 0.1}>
              <div
                className={`relative overflow-hidden group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-2xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Top Edge Gradient Accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

                <div className={`lg:col-span-7 space-y-4 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-site-surface-2 text-site-text-2 border border-site-border-subtle">
                    {uc.badge}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-site-text tracking-tight group-hover:text-accent transition-colors">
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
                  <div className="transition-all duration-300 hover:-translate-y-1 rounded-xl">
                    {uc.mockup}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <Reveal delay={0.4}>
          <div className="relative overflow-hidden rounded-2xl border border-site-border bg-site-surface/85 backdrop-blur-md p-8 sm:p-12 text-center space-y-4 shadow-lg">
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-site-text tracking-tight">
                {t("footer.captureBugsFaster")}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 max-w-md mx-auto leading-relaxed">
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
