"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";

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
      <div className="flex items-center justify-center gap-3 mb-12">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground font-semibold" : "text-muted hover:text-foreground"}`}
        >
          {t("pricing.monthly")}
        </button>
        <button
          type="button"
          onClick={() => setYearly((v) => !v)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${yearly ? "bg-[#89BD49]" : "bg-slate-300 dark:bg-neutral-700"}`}
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
              yearly ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${yearly ? "text-foreground font-semibold" : "text-muted hover:text-foreground"}`}
        >
          <span>{t("pricing.yearly")}</span>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            {t("pricing.yearlySave")}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {tiers.map((tier) => {
          const price = yearly ? tier.yearly : tier.monthly;
          return (
            <div
              key={tier.id}
              className={`rounded-2xl border overflow-hidden relative flex flex-col backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                tier.popular
                  ? "border-[#89BD49] bg-white dark:bg-subtle shadow-xl shadow-[#89BD49]/15 md:-translate-y-2 md:hover:-translate-y-3 ring-1 ring-[#89BD49]/30"
                  : "border-white/80 dark:border-border bg-white/80 dark:bg-subtle shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-[#89BD49]/40"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-[#89BD49] text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-lg shadow-sm">
                  {t("pricing.mostPopular")}
                </div>
              )}

              <div className="p-5 sm:p-8 border-b border-border bg-subtle/30">
                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted mt-1.5 min-h-[2rem] leading-relaxed">{tier.tagline}</p>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-foreground">${price}</span>
                  <span className="text-muted text-sm font-medium"> {t("pricing.perMonth")}</span>
                  {tier.monthly !== tier.yearly && yearly && (
                    <p className="text-[11px] text-muted mt-1">{t("pricing.billedYearly")}</p>
                  )}
                </div>
                <a
                  href={tier.href}
                  target={tier.href.startsWith("http") ? "_blank" : undefined}
                  rel={tier.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`block w-full text-center font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 ${
                    tier.popular
                      ? "bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-md hover:shadow-lg shadow-[#89BD49]/20"
                      : "border border-border bg-white dark:bg-subtle hover:bg-subtle dark:hover:bg-border/30 text-foreground"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>

              <div className="p-5 sm:p-8 flex-1">
                <ul className="space-y-3.5 text-sm text-foreground">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3.5 8.5l3 3 6-6" />
                        </svg>
                      </span>
                      <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
