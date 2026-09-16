"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

const CARD = "group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-xl";

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
      <div className="mx-auto max-w-5xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* FAQ Left Column - Expandable Accordion */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground">{t("help.faqHeading")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle shadow-md shadow-slate-200/40 dark:shadow-none backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? t("help.closeFaq") : t("help.openFaq")}
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {faq.q}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-subtle flex items-center justify-center shrink-0 text-muted transition-transform duration-300">
                      <svg
                        className={`w-3.5 h-3.5 transform transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-muted leading-relaxed border-t border-border/40 animate-fade-in-up">
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
          <div className={`${CARD} p-6 space-y-4`}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/25 transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-foreground">{t("help.needHelp")}</h3>
            <p className="text-xs text-muted leading-relaxed">{t("help.needHelpDesc")}</p>
            <a
              href="mailto:support@akusaradigital.com"
              className="block text-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {t("help.emailSupport")}
            </a>
          </div>

          <div className={`${CARD} p-6 space-y-3`}>
            <h3 className="text-sm font-bold text-foreground">{t("help.getStarted")}</h3>
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {t("help.installFree")}
            </a>
            <Link
              href="/pricing"
              className="block text-center border border-border bg-white dark:bg-subtle hover:bg-subtle dark:hover:bg-border/30 text-foreground text-sm font-semibold py-2.5 rounded-xl transition-all"
            >
              {t("help.seePricing")}
            </Link>
          </div>

          <div className={`${CARD} p-6 space-y-3`}>
            <h3 className="text-sm font-bold text-foreground">{t("help.resources")}</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/docs" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  {t("help.viewDocs")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  {t("help.contactForm")}
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  {t("help.systemStatus")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </StaticShell>
  );
}
