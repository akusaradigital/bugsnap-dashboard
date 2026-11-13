"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function HelpContent() {
  const { t, locale } = useT();
  const isId = locale === "id";
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
      titleHighlight={t("help.titleHighlight")}
      breadcrumb={isId ? "Pusat Bantuan" : "Help"}
      subtitle={t("help.subtitle")}
      compactHero={true}
      hideDivider={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-site">

        {/* FAQ Left Column */}
        <div className="lg:col-span-8 space-y-4">
          <Reveal delay={0.05}>
            <h2 className="text-xl sm:text-2xl font-bold text-site-text mb-4 sm:mb-5">
              {t("help.faqHeading")}
            </h2>
          </Reveal>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <Reveal key={i} delay={0.08 + i * 0.05}>
                  <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 transition-colors hover:border-site-border-focus">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 touch-manipulation group"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${i}`}
                      aria-label={isOpen ? t("help.closeFaq") : t("help.openFaq")}
                    >
                      <span className="text-base sm:text-lg font-bold text-site-text group-hover:text-accent transition-colors">
                        {faq.q}
                      </span>
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isOpen
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-slate-900 dark:text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        }`}
                      >
                        <Icon
                          icon="lucide:chevron-down"
                          className="w-4 h-4 text-current"
                          aria-hidden="true"
                        />
                      </span>
                    </button>

                    <div
                      id={`faq-answer-${i}`}
                      role="region"
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="pt-3.5 sm:pt-4 text-sm text-site-text-2 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* Card 1: Still need help? */}
          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 space-y-2 transition-colors hover:border-site-border-focus">
              <h3 className="text-base sm:text-lg font-bold text-site-text">
                {t("help.needHelp")}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                {t("help.needHelpDesc")}
              </p>
              <div className="pt-2">
                <a
                  href="mailto:support@akusaradigital.com"
                  className="flex items-center justify-center gap-2 w-full border border-site-border bg-white dark:bg-site-surface-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-site-text text-sm font-semibold py-2.5 sm:py-3 rounded-xl transition-colors shadow-xs touch-manipulation"
                >
                  <Icon icon="lucide:mail" className="w-4 h-4 text-site-text shrink-0" />
                  <span>{t("help.emailSupport")}</span>
                </a>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Get started */}
          <Reveal delay={0.22}>
            <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 space-y-3 transition-colors hover:border-site-border-focus">
              <h3 className="text-base sm:text-lg font-bold text-site-text">
                {t("help.getStarted")}
              </h3>
              <div className="space-y-2.5 pt-1">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold py-2.5 sm:py-3 rounded-xl transition-colors shadow-xs touch-manipulation"
                >
                  <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t("help.installFree")}</span>
                </a>
                <a
                  href={FIREFOX_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold py-2.5 sm:py-3 rounded-xl transition-colors shadow-xs touch-manipulation"
                >
                  <Icon icon="logos:firefox" className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t("extension.addToFirefox")}</span>
                </a>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 w-full border border-site-border bg-white dark:bg-site-surface-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-site-text text-sm font-semibold py-2.5 sm:py-3 rounded-xl transition-colors shadow-xs touch-manipulation"
                >
                  <Icon icon="lucide:tag" className="w-4 h-4 text-site-text shrink-0" />
                  <span>{t("help.seePricing")}</span>
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Card 3: Resources */}
          <Reveal delay={0.29}>
            <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 space-y-3 transition-colors hover:border-site-border-focus">
              <h3 className="text-base sm:text-lg font-bold text-site-text">
                {t("help.resources")}
              </h3>
              <ul className="space-y-3 pt-1 text-sm font-semibold">
                <li>
                  <Link
                    href="/docs"
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline touch-manipulation"
                  >
                    <span>{t("help.viewDocs")}</span>
                    <span></span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline touch-manipulation"
                  >
                    <span>{t("help.contactForm")}</span>
                    <span></span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline touch-manipulation"
                  >
                    <span>{t("help.systemStatus")}</span>
                    <span></span>
                  </Link>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

      </div>
    </StaticShell>
  );
}
