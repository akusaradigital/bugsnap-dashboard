"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { IconCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

export function PricingToggle() {
  const { t } = useT();
  const [yearly, setYearly] = useState(true);

  const tiers = [
    {
      id: "free",
      name: t("pricing.tierFree"),
      tagline: t("pricing.tierFreeTagline"),
      monthly: 0,
      yearly: 0,
      cta: t("pricing.tierFreeCta"),
      href: "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf",
      popular: false,
      features: [
        t("pricing.fFree1"),
        t("pricing.fFree2"),
        t("pricing.fFree3"),
        t("pricing.fFree4"),
        t("pricing.fFree5"),
        t("pricing.fFree6"),
      ],
    },
    {
      id: "pro",
      name: t("pricing.tierPro"),
      tagline: t("pricing.tierProTagline"),
      monthly: 7,
      yearly: 5,
      cta: t("pricing.tierProCta"),
      href: "/login",
      popular: true,
      features: [
        t("pricing.fPro1"),
        t("pricing.fPro2"),
        t("pricing.fPro3"),
        t("pricing.fPro4"),
        t("pricing.fPro5"),
        t("pricing.fPro6"),
      ],
    },
    {
      id: "proplus",
      name: t("pricing.tierProPlus"),
      tagline: t("pricing.tierProPlusTagline"),
      monthly: 12,
      yearly: 9,
      cta: t("pricing.tierProPlusCta"),
      href: "/login",
      popular: false,
      features: [
        t("pricing.fProPlus1"),
        t("pricing.fProPlus2"),
        t("pricing.fProPlus3"),
        t("pricing.fProPlus4"),
        t("pricing.fProPlus5"),
      ],
    },
    {
      id: "enterprise",
      name: t("pricing.tierEnterprise"),
      tagline: t("pricing.tierEnterpriseTagline"),
      monthly: 24,
      yearly: 20,
      cta: t("pricing.tierEnterpriseCta"),
      href: "/contact",
      popular: false,
      features: [
        t("pricing.fEnt1"),
        t("pricing.fEnt2"),
        t("pricing.fEnt3"),
        t("pricing.fEnt4"),
        t("pricing.fEnt5"),
      ],
    },
  ];

  return (
    <>
      {/* Billing Switcher */}
      <Reveal delay={0}>
        <div className="flex items-center justify-center gap-3 mb-10 font-site">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`text-xs font-medium transition-colors ${
              !yearly ? "text-site-text font-bold" : "text-site-text-2 hover:text-site-text"
            }`}
          >
            {t("pricing.monthly")}
          </button>

          <button
            type="button"
            onClick={() => setYearly((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              yearly ? "bg-accent" : "bg-site-surface-2 border-site-border"
            }`}
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly billing"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                yearly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`text-xs font-medium transition-colors flex items-center gap-1.5 ${
              yearly ? "text-site-text font-bold" : "text-site-text-2 hover:text-site-text"
            }`}
          >
            <span>{t("pricing.yearly")}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {t("pricing.yearlySave")}
            </span>
          </button>
        </div>
      </Reveal>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch font-site">
        {tiers.map((tier, i) => {
          const price = yearly ? tier.yearly : tier.monthly;
          return (
            <Reveal key={tier.id} delay={i * 0.1} className="h-full">
              <div
                className={`relative overflow-hidden group h-full rounded-xl border flex flex-col justify-between ${
                  tier.popular
                    ? "border-accent/70 bg-gradient-to-b from-site-surface via-site-surface to-accent/10 ring-1 ring-accent/60 shadow-md shadow-accent/10"
                    : "border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/60 shadow-sm"
                }`}
              >
                {/* Top Edge Gradient Accent */}
                {tier.popular && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-emerald-400 to-accent" aria-hidden="true" />
                )}

                {/* Header Box */}
                <div className="p-5 sm:p-6 border-b border-site-border-subtle bg-site-surface-2/40 relative">
                  {tier.popular && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gradient-to-r from-accent to-emerald-400 text-slate-950 shadow-xs">
                      {t("pricing.mostPopular")}
                    </span>
                  )}
                  <h3 className={`text-base font-bold text-site-text ${tier.popular ? "pr-24" : ""}`}>{tier.name}</h3>
                  <p className="text-xs text-site-text-2 mt-1 min-h-[2rem] leading-relaxed">{tier.tagline}</p>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-site-text tabular-nums">${price}</span>
                    <span className="text-site-text-2 text-xs"> {t("pricing.perMonth")}</span>
                    {tier.monthly !== tier.yearly && yearly && (
                      <p className="text-[10px] text-site-text-2 mt-0.5">{t("pricing.billedYearly")}</p>
                    )}
                  </div>

                  <a
                    href={tier.href}
                    target={tier.href.startsWith("http") ? "_blank" : undefined}
                    rel={tier.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={`block w-full text-center font-semibold text-xs py-2 rounded-lg transition-all shadow-xs ${
                      tier.popular
                        ? "bg-accent hover:bg-accent-hover text-slate-900 hover:text-white shadow-xs hover:shadow-sm"
                        : "border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>

                {/* Feature List */}
                <div className="p-5 sm:p-6 flex-1">
                  <ul className="space-y-3 text-xs text-site-text">
                    {tier.features.map((f, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-2">
                        <IconCheck size={14} className="text-accent mt-0.5 shrink-0" />
                        <span className="leading-relaxed text-site-text-2">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
