"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { Reveal } from "@/components/site/motion";

interface FeatureRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  org: string | boolean;
}

interface FeatureCategory {
  title: string;
  features: FeatureRow[];
}

export function PricingToggle() {
  const { t } = useT();
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const CHROME_STORE_URL =
    "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

  const tiers = [
    {
      id: "free",
      name: t("pricing.tierFree"),
      persona: t("pricing.tierFreePersona"),
      tagline: t("pricing.tierFreeTagline"),
      monthly: 0,
      yearly: 0,
      cta: t("pricing.tierFreeCta"),
      href: CHROME_STORE_URL,
      isExternal: true,
      popular: false,
      badge: null,
      featuresTitle: t("pricing.keyFeatures"),
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
      persona: t("pricing.tierProPersona"),
      tagline: t("pricing.tierProTagline"),
      monthly: 10,
      yearly: 8,
      cta: t("pricing.tierProCta"),
      href: "/login",
      isExternal: false,
      popular: true,
      badge: t("pricing.mostPopular"),
      featuresTitle: t("pricing.everythingInFree"),
      features: [
        t("pricing.fPro2"),
        t("pricing.fPro3"),
        t("pricing.fPro4"),
        t("pricing.fPro5"),
        t("pricing.fPro6"),
        "cURL & HAR exporter for instant API repros",
      ],
    },
    {
      id: "enterprise",
      name: t("pricing.tierOrg"),
      persona: t("pricing.tierOrgPersona"),
      tagline: t("pricing.tierOrgTagline"),
      monthly: 20,
      yearly: 16,
      cta: t("pricing.tierOrgCta"),
      href: "/contact",
      isExternal: false,
      popular: false,
      badge: null,
      featuresTitle: t("pricing.everythingInPro"),
      features: [
        t("pricing.fEnt2"),
        t("pricing.fEnt3"),
        t("pricing.fEnt4"),
        t("pricing.fEnt5"),
        "Custom Google Drive shared drives integration",
      ],
    },
  ];

  const categories: FeatureCategory[] = [
    {
      title: t("pricing.catCapture"),
      features: [
        {
          name: "Screenshots & Full-page capture",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "1080p Screen & Audio recording",
          free: "Up to 5 mins",
          pro: "Up to 60 mins",
          org: "Unlimited",
        },
        {
          name: "Automated Console & Network logs",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "DOM Session Replay (rrweb)",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "Visual Compare (Split Slider & Diff)",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "SPA Memory Leak & DOM Bloat Detector",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "Auto Playwright Test Generator",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "Model Context Protocol (MCP) Server for AI",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "cURL & HAR Dev Exporter",
          free: false,
          pro: true,
          org: true,
        },
        {
          name: "Smart element snap & blur redaction",
          free: true,
          pro: true,
          org: true,
        },
      ],
    },
    {
      title: t("pricing.catStorage"),
      features: [
        {
          name: "Storage location",
          free: "Your Google Drive",
          pro: "Your Google Drive",
          org: "Your Google Drive",
        },
        {
          name: "Extra storage fees from BugSnap",
          free: "$0 (Never charged)",
          pro: "$0 (Never charged)",
          org: "$0 (Never charged)",
        },
        {
          name: "PII & secret client-side scrubbing",
          free: "Standard",
          pro: "Advanced",
          org: "Custom regex rules",
        },
        {
          name: "Full media data ownership",
          free: "100% Yours",
          pro: "100% Yours",
          org: "100% Yours",
        },
        {
          name: "Shared Drives (Team Drive) support",
          free: false,
          pro: true,
          org: true,
        },
      ],
    },
    {
      title: t("pricing.catCollab"),
      features: [
        {
          name: "Workspaces",
          free: "1 workspace",
          pro: "Unlimited",
          org: "Unlimited",
        },
        {
          name: "Paid editors / creators",
          free: "Up to 5",
          pro: "Unlimited",
          org: "Unlimited",
        },
        {
          name: "Viewers, commenters & guests",
          free: "Unlimited Free",
          pro: "Unlimited Free",
          org: "Unlimited Free",
        },
        {
          name: "Time-stamped video comments",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "Password-protected share links",
          free: false,
          pro: true,
          org: true,
        },
        {
          name: "Auto-expiring links (24h, 7d)",
          free: false,
          pro: true,
          org: true,
        },
      ],
    },
    {
      title: t("pricing.catSecurity"),
      features: [
        {
          name: "Custom branding (Logo & Name)",
          free: false,
          pro: true,
          org: true,
        },
        {
          name: "Remove BugSnap watermark",
          free: false,
          pro: true,
          org: true,
        },
        {
          name: "Custom domain (bugs.yourcompany.com)",
          free: false,
          pro: false,
          org: true,
        },
        {
          name: "IP & domain allowlist",
          free: false,
          pro: false,
          org: true,
        },
        {
          name: "Burn-after-reading links",
          free: false,
          pro: false,
          org: true,
        },
        {
          name: "SAML 2.0 SSO & SCIM directory sync",
          free: false,
          pro: false,
          org: true,
        },
      ],
    },
    {
      title: t("pricing.catSupport"),
      features: [
        {
          name: "Documentation & Community",
          free: true,
          pro: true,
          org: true,
        },
        {
          name: "Support response time",
          free: "Standard",
          pro: "< 24 Hours",
          org: "Dedicated SLA",
        },
        {
          name: "Payment & Procurement",
          free: "Free forever",
          pro: "Credit Card / Paddle",
          org: "Invoicing & Wire",
        },
      ],
    },
  ];

  const faqs = [
    {
      q: t("pricing.faqQ1"),
      a: t("pricing.faqA1"),
    },
    {
      q: t("pricing.faqQ2"),
      a: t("pricing.faqA2"),
    },
    {
      q: t("pricing.faqQ3"),
      a: t("pricing.faqA3"),
    },
    {
      q: t("pricing.faqQ4"),
      a: t("pricing.faqA4"),
    },
    {
      q: t("pricing.faqQ5"),
      a: t("pricing.faqA5"),
    },
  ];

  const renderCellValue = (val: string | boolean) => {
    if (typeof val === "boolean") {
      return val ? (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon icon="lucide:check" className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span className="text-site-text-2/40 select-none font-medium">-</span>
      );
    }
    return (
      <span className="text-xs font-medium text-site-text leading-tight">
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-20 font-site">
      {/* 1. Header & Billing Switcher */}
      <div className="text-center">
        {/* Segmented Billing Switch Container */}
        <Reveal delay={0}>
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center bg-site-surface-2 border border-site-border p-1 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`px-4 py-2 min-h-[40px] rounded-md text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
                  !yearly
                    ? "bg-site-surface text-site-text shadow-2xs border border-site-border"
                    : "text-site-text-2 hover:text-site-text"
                }`}
              >
                {t("pricing.monthlyBilling")}
              </button>

              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`px-4 py-2 min-h-[40px] rounded-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer touch-manipulation ${
                  yearly
                    ? "bg-site-surface text-site-text shadow-2xs border border-site-border"
                    : "text-site-text-2 hover:text-site-text"
                }`}
              >
                <span>{t("pricing.annualBilling")}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666]">
                  {t("pricing.saveBadge")}
                </span>
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* 2. Three Whimsical Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {tiers.map((tier, i) => {
          const price = yearly ? tier.yearly : tier.monthly;

          return (
            <Reveal key={tier.id} delay={0.1 * (i + 1)} className="h-full">
              <div
                className={`relative h-full rounded-2xl border flex flex-col justify-between transition-all duration-200 min-w-0 ${
                  tier.popular
                    ? "border-[#89BD49] bg-site-surface ring-2 ring-[#89BD49]/20 shadow-lg dark:shadow-[#89BD49]/5"
                    : "border-site-border bg-site-surface shadow-xs hover:border-site-border-focus"
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#89BD49] text-white shadow-2xs">
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Card Top Section */}
                <div className="p-6 sm:p-7 flex flex-col border-b border-site-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-site-text tracking-tight">
                      {tier.name}
                    </h3>
                  </div>

                  <p className="text-xs text-site-text-2 mt-1.5 min-h-[32px] leading-relaxed">
                    {tier.persona}
                  </p>

                  {/* Price */}
                  <div className="my-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-site-text tabular-nums tracking-tight">
                        ${price}
                      </span>
                      <span className="text-xs text-site-text-2 font-medium">
                        {t("pricing.perEditorMonth")}
                      </span>
                    </div>

                    <p className="text-[11px] text-site-text-2/80 mt-1">
                      {tier.id === "free"
                        ? t("pricing.freeForever")
                        : yearly
                        ? `Billed annually ($${price * 12}/yr)`
                        : "Billed monthly"}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="space-y-3">
                    <a
                      href={tier.href}
                      target={tier.isExternal ? "_blank" : undefined}
                      rel={tier.isExternal ? "noopener noreferrer" : undefined}
                      className={`w-full py-2.5 px-4 min-h-[44px] flex items-center justify-center rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-xs touch-manipulation ${
                        tier.popular
                          ? "bg-[#89BD49] hover:bg-[#78a83f] text-white shadow-sm"
                          : "border border-site-border bg-site-surface-2 hover:bg-site-surface text-site-text"
                      }`}
                    >
                      {tier.cta}
                    </a>

                    <a
                      href="#feature-matrix"
                      className="block text-center text-[11px] font-medium text-site-text-2 hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors"
                    >
                      {t("pricing.seeAllFeatures")} ↓
                    </a>
                  </div>
                </div>

                {/* Card Bottom Feature Highlights */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-site-surface-2/30 rounded-b-2xl">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-site-text-2 mb-3.5">
                      {tier.featuresTitle}
                    </h4>

                    <ul className="space-y-2.5 text-xs">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Icon
                            icon="lucide:check"
                            className="w-4 h-4 text-[#89BD49] shrink-0 mt-0.5"
                          />
                          <span className="text-site-text-2 leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* 3. Whimsical Feature Comparison Matrix Table */}
      <div id="feature-matrix" className="pt-8">
        <Reveal delay={0.2}>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("pricing.compareTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 mt-2">
              {t("pricing.compareSubtitle")}
            </p>
          </div>
        </Reveal>

        {/* Matrix Card Wrapper */}
        <Reveal delay={0.25}>
          <div className="rounded-2xl border border-site-border bg-site-surface overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                {/* Sticky Header Columns */}
                <thead>
                  <tr className="border-b border-site-border bg-site-surface-2/60">
                    <th className="py-4 px-6 text-xs font-bold text-site-text uppercase tracking-wider w-2/5">
                      {t("pricing.feature")}
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-site-text text-center w-1/5">
                      {t("pricing.tierFree")}
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-[#6B9A35] dark:text-[#A8D666] text-center w-1/5">
                      {t("pricing.tierPro")}
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-site-text text-center w-1/5">
                      {t("pricing.tierOrg")}
                    </th>
                  </tr>
                </thead>

                {/* Grouped Rows */}
                <tbody className="divide-y divide-site-border/60">
                  {categories.map((cat, catIdx) => (
                    <Fragment key={catIdx}>
                      {/* Category Header */}
                      <tr className="bg-site-surface-2/40 border-t border-b border-site-border">
                        <td
                          colSpan={4}
                          className="py-3 px-6 text-xs font-bold text-site-text uppercase tracking-wider"
                        >
                          {cat.title}
                        </td>
                      </tr>

                      {/* Category Rows */}
                      {cat.features.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-site-surface-2/20 transition-colors"
                        >
                          <td className="py-3.5 px-6 text-xs font-medium text-site-text">
                            {row.name}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderCellValue(row.free)}
                          </td>
                          <td className="py-3.5 px-4 text-center bg-[#89BD49]/5">
                            {renderCellValue(row.pro)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderCellValue(row.org)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>

      {/* 4. Whimsical FAQ Accordion */}
      <div className="max-w-3xl mx-auto pt-4">
        <Reveal delay={0.35}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-site-text tracking-tight">
              {t("pricing.faqTitle")}
            </h2>
            <p className="text-xs text-site-text-2 mt-1.5">
              {t("pricing.faqSubtitle")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-site-border bg-site-surface overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`pricing-faq-${idx}`}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-site-surface-2/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-site-text">
                      {faq.q}
                    </span>
                    <Icon
                      icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                      className="w-4 h-4 text-site-text-2 shrink-0 transition-transform"
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`pricing-faq-${idx}`}
                      className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-site-text-2 leading-relaxed border-t border-site-border/40 pt-3"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/* 6. Whimsical Bottom CTA Banner */}
      <Reveal delay={0.45}>
        <div className="rounded-2xl border border-site-border bg-site-surface-2/60 p-4 sm:p-12 text-center space-y-4 max-w-4xl mx-auto shadow-xs">
          <h3 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
            {t("pricing.bottomCtaTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-site-text-2 max-w-xl mx-auto leading-relaxed">
            {t("pricing.bottomCtaSub")}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-white text-xs font-bold transition-all shadow-xs"
            >
              {t("pricing.bottomCtaBtn")}
            </a>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold transition-all shadow-xs"
            >
              {t("pricing.contactSales")}
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
