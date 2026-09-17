"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

const CARD = "group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm transition-all duration-300 hover:border-[#89BD49]/40 hover:-translate-y-1 hover:shadow-xl";

export function ContactContent() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("contact.title")}
      subtitle={t("contact.subtitle")}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Contact Methods */}
          <div className="space-y-6">
            {/* Email Support Card */}
            <div className={`${CARD} p-5 sm:p-6 space-y-3`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B9A35] dark:text-[#A8D666]">
                    {t("contact.emailSupport")}
                  </h3>
                  <a
                    href="mailto:support@akusaradigital.com"
                    className="text-sm font-bold text-slate-900 dark:text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors"
                  >
                    support@akusaradigital.com
                  </a>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t("contact.emailDesc")}
              </p>
            </div>

            {/* Company Info Card */}
            <div className={`${CARD} p-5 sm:p-6 space-y-3`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B9A35] dark:text-[#A8D666]">
                    {t("contact.company")}
                  </h3>
                  <p className="text-sm font-bold text-slate-900 dark:text-foreground">Akusara Digital</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t("contact.companyDesc")}
              </p>
              <div className="text-xs text-muted pt-1 flex items-center gap-1.5">
                <span>{t("contact.websiteLabel")}</span>
                <a
                  href="https://akusaradigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors"
                >
                  akusaradigital.com
                </a>
              </div>
            </div>

            {/* Enterprise Card */}
            <div className={`${CARD} p-5 sm:p-6 space-y-3`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B9A35] dark:text-[#A8D666]">
                    {t("contact.enterprise")}
                  </h3>
                  <p className="text-sm font-bold text-slate-900 dark:text-foreground">{t("contact.enterpriseTitle")}</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t("contact.enterpriseDesc")}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Action Box */}
            <div className={`${CARD} p-5 sm:p-6 space-y-4`}>
              <h3 className="text-base font-bold text-foreground">{t("contact.startCapturing")}</h3>
              <a
                href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md shadow-[#89BD49]/25"
              >
                {t("contact.installFree")}
              </a>
              <Link
                href="/pricing"
                className="block text-center border border-border bg-white dark:bg-subtle hover:bg-subtle dark:hover:bg-border/30 text-foreground text-sm font-semibold py-2.5 rounded-xl transition-all"
              >
                {t("contact.seePricing")}
              </Link>
            </div>

            {/* Resources List */}
            <div className={`${CARD} p-5 sm:p-6 space-y-4`}>
              <h3 className="text-base font-bold text-foreground">{t("contact.usefulResources")}</h3>
              <ul className="space-y-3.5 text-xs">
                <li className="flex flex-col gap-0.5">
                  <Link href="/privacy" className="font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors">
                    {t("contact.privacy")}
                  </Link>
                  <span className="text-muted leading-relaxed">{t("contact.privacyDesc")}</span>
                </li>
                <li className="flex flex-col gap-0.5 border-t border-border/50 pt-3">
                  <Link href="/terms" className="font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors">
                    {t("contact.terms")}
                  </Link>
                  <span className="text-muted leading-relaxed">{t("contact.termsDesc")}</span>
                </li>
                <li className="flex flex-col gap-0.5 border-t border-border/50 pt-3">
                  <Link href="/docs" className="font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors">
                    {t("contact.docs")}
                  </Link>
                  <span className="text-muted leading-relaxed">{t("contact.docsDesc")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
