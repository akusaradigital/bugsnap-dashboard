"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { IconChevronDown, IconHelpCircle } from "@/components/site/TablerIcons";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HelpContent() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t("help.faq1Q"), a: t("help.faq1A") },
    { q: t("help.faq2Q"), a: t("help.faq2A") },
    { q: t("help.faq3Q"), a: t("help.faq3A") },
    { q: t("help.faq4Q"), a: t("help.faq4A") },
  ];

  return (
    <StaticShell
      title={t("help.title")}
      subtitle={t("help.subtitle")}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-site">

        {/* FAQ Left Column - Expandable Accordion */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-site-text">{t("help.faqHeading")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-site-border bg-site-surface shadow-xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? t("help.closeFaq") : t("help.openFaq")}
                  >
                    <span className="text-xs sm:text-sm font-bold text-site-text hover:text-accent transition-colors">
                      {faq.q}
                    </span>
                    <span className="w-6 h-6 rounded bg-site-surface-2 border border-site-border-subtle flex items-center justify-center shrink-0 text-site-text-2">
                      <IconChevronDown
                        size={14}
                        strokeWidth={2}
                        className={`transform transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-site-text-2 leading-relaxed border-t border-site-border-subtle">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
              <IconHelpCircle size={20} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-site-text">{t("help.needHelp")}</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">{t("help.needHelpDesc")}</p>
            <a
              href="mailto:support@akusaradigital.com"
              className="block text-center border border-site-border bg-site-surface-2 hover:bg-site-surface text-site-text text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              {t("help.emailSupport")}
            </a>
          </div>

          <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-site-text">{t("help.getStarted")}</h3>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 hover:text-white text-xs font-semibold py-2 rounded-lg transition-colors shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>{t("help.installFree")}</span>
            </a>
            <Link
              href="/pricing"
              className="block text-center border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              {t("help.seePricing")}
            </Link>
          </div>

          <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-site-text">{t("help.resources")}</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/docs" className="text-accent hover:underline">
                  {t("help.viewDocs")} →
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-accent hover:underline">
                  {t("help.contactForm")} →
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-accent hover:underline">
                  {t("help.systemStatus")} →
                </Link>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </StaticShell>
  );
}
