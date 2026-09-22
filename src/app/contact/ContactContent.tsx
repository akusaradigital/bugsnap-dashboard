"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { IconMail, IconBuilding, IconShieldCheck } from "@/components/site/TablerIcons";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function ContactContent() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("contact.title")}
      subtitle={t("contact.subtitle")}
    >
      <div className="space-y-8 font-site">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Contact Methods */}
          <div className="space-y-6">
            {/* Email Support Card */}
            <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
                  <IconMail size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {t("contact.emailSupport")}
                  </h3>
                  <a
                    href="mailto:support@akusaradigital.com"
                    className="text-sm font-bold text-site-text hover:underline"
                  >
                    support@akusaradigital.com
                  </a>
                </div>
              </div>
              <p className="text-xs text-site-text-2 leading-relaxed">
                {t("contact.emailDesc")}
              </p>
            </div>

            {/* Company Info Card */}
            <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
                  <IconBuilding size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {t("contact.company")}
                  </h3>
                  <p className="text-sm font-bold text-site-text">Akusara Digital</p>
                </div>
              </div>
              <p className="text-xs text-site-text-2 leading-relaxed">
                {t("contact.companyDesc")}
              </p>
              <div className="text-xs text-site-text-2 pt-1 flex items-center gap-1.5">
                <span>{t("contact.websiteLabel")}</span>
                <a
                  href="https://akusaradigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:underline"
                >
                  akusaradigital.com →
                </a>
              </div>
            </div>

            {/* Enterprise Card */}
            <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center">
                  <IconShieldCheck size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {t("contact.enterprise")}
                  </h3>
                  <p className="text-sm font-bold text-site-text">{t("contact.enterpriseTitle")}</p>
                </div>
              </div>
              <p className="text-xs text-site-text-2 leading-relaxed">
                {t("contact.enterpriseDesc")}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Action Box */}
            <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-site-text">{t("contact.startCapturing")}</h3>
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 hover:text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
                <span>{t("contact.installFree")}</span>
              </a>
              <Link
                href="/pricing"
                className="block text-center border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                {t("contact.seePricing")}
              </Link>
            </div>

            {/* Resources List */}
            <div className="rounded-xl border border-site-border bg-site-surface p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-site-text">{t("contact.usefulResources")}</h3>
              <ul className="space-y-3.5 text-xs">
                <li className="flex flex-col gap-0.5">
                  <Link href="/privacy" className="font-semibold text-accent hover:underline">
                    {t("contact.privacy")}
                  </Link>
                  <span className="text-site-text-2 leading-relaxed">{t("contact.privacyDesc")}</span>
                </li>
                <li className="flex flex-col gap-0.5 border-t border-site-border-subtle pt-3">
                  <Link href="/terms" className="font-semibold text-accent hover:underline">
                    {t("contact.terms")}
                  </Link>
                  <span className="text-site-text-2 leading-relaxed">{t("contact.termsDesc")}</span>
                </li>
                <li className="flex flex-col gap-0.5 border-t border-site-border-subtle pt-3">
                  <Link href="/docs" className="font-semibold text-accent hover:underline">
                    {t("contact.docs")}
                  </Link>
                  <span className="text-site-text-2 leading-relaxed">{t("contact.docsDesc")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
