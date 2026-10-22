"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { IconMail, IconBuilding, IconShieldCheck } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

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
            <Reveal delay={0}>
              <div className="group rounded-xl border border-site-border bg-site-surface p-4 sm:p-6 space-y-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-site-border-focus hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center transition-colors group-hover:border-accent/40 group-hover:text-accent group-hover:bg-accent/5 shrink-0">
                    <IconMail size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-accent">
                      {t("contact.emailSupport")}
                    </h3>
                    <a
                      href="mailto:support@akusaradigital.com"
                      className="text-sm font-bold text-site-text hover:underline break-all"
                    >
                      support@akusaradigital.com
                    </a>
                  </div>
                </div>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("contact.emailDesc")}
                </p>
              </div>
            </Reveal>

            {/* Company Info Card */}
            <Reveal delay={0.08}>
              <div className="group rounded-xl border border-site-border bg-site-surface p-4 sm:p-6 space-y-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-site-border-focus hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center transition-colors group-hover:border-accent/40 group-hover:text-accent group-hover:bg-accent/5 shrink-0">
                    <IconBuilding size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-accent">
                      {t("contact.company")}
                    </h3>
                    <p className="text-sm font-bold text-site-text">Akusara Digital</p>
                  </div>
                </div>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("contact.companyDesc")}
                </p>
                <div className="text-xs text-site-text-2 pt-1 flex items-center gap-1.5 flex-wrap">
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
            </Reveal>

            {/* Enterprise Card */}
            <Reveal delay={0.16}>
              <div className="group rounded-xl border border-site-border bg-site-surface p-4 sm:p-6 space-y-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-site-border-focus hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-site-surface-2 border border-site-border text-site-text flex items-center justify-center transition-colors group-hover:border-accent/40 group-hover:text-accent group-hover:bg-accent/5 shrink-0">
                    <IconShieldCheck size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
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
            </Reveal>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Action Box */}
            <Reveal delay={0.1}>
              <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-bold text-site-text">{t("contact.startCapturing")}</h3>
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs font-semibold py-2.5 min-h-[44px] rounded-lg transition-colors shadow-xs touch-manipulation"
                >
                  <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t("contact.installFree")}</span>
                </a>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center text-center border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold py-2.5 min-h-[44px] rounded-lg transition-colors touch-manipulation"
                >
                  {t("contact.seePricing")}
                </Link>
              </div>
            </Reveal>

            {/* Resources List / FAQ */}
            <Reveal delay={0.18}>
              <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-6 space-y-4 shadow-xs">
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
                  <li className="flex flex-col gap-0.5 border-t border-site-border-subtle pt-3">
                    <Link href="/help" className="font-semibold text-accent hover:underline">
                      {t("help.title")}
                    </Link>
                    <span className="text-site-text-2 leading-relaxed">{t("help.subtitle")}</span>
                  </li>
                  <li className="flex flex-col gap-0.5 border-t border-site-border-subtle pt-3">
                    <Link href="/terms#refund" className="font-semibold text-accent hover:underline">
                      Refund &amp; Cancellation Policy
                    </Link>
                    <span className="text-site-text-2 leading-relaxed">14-day statutory money-back guarantee and 1-click self-serve cancellation.</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Consumer Protection & Dispute Handling (Layanan Pengaduan Konsumen) */}
        <Reveal delay={0.24}>
          <div id="complaint" className="scroll-mt-24 rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-site-border-subtle pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-site-accent">
                  Support &amp; Consumer Satisfaction
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-site-text">
                  Customer Support &amp; Dispute Resolution Channel
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Global Support Standards</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-site-text-2 leading-relaxed">
              <div className="space-y-2 rounded-xl bg-site-surface-2 p-4 border border-site-border-subtle">
                <h3 className="font-bold text-sm text-site-text">1. Dedicated Customer Support &amp; Inquiries</h3>
                <p>
                  In accordance with global consumer protection standards and fair digital practices, we provide dedicated channels to resolve questions, billing inquiries, feedback, or refund requests promptly:
                </p>
                <div className="space-y-1 pt-1 font-sans text-xs">
                  <div><strong>Support &amp; Resolution Email:</strong> <a href="mailto:support@akusaradigital.com" className="text-accent underline font-semibold">support@akusaradigital.com</a></div>
                  <div><strong>Response SLA:</strong> Within 2 business days (typically under 24 hours).</div>
                  <div><strong>Operating Entity:</strong> Akusara Digital</div>
                </div>
              </div>

              <div className="space-y-2 rounded-xl bg-site-surface-2 p-4 border border-site-border-subtle">
                <h3 className="font-bold text-sm text-site-text">2. Fair Resolution &amp; 14-Day Refund Guarantee</h3>
                <p>
                  We are committed to fair customer treatment worldwide. If you encounter any issue or are dissatisfied with BugSnap Pro:
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div><strong>14-Day Money-Back Guarantee:</strong> 100% full refund upon request within 14 days of purchase.</div>
                  <div><strong>Self-Serve Cancellation:</strong> 1-click subscription management anytime in your billing portal.</div>
                  <div><strong>Good-Faith Resolution:</strong> All inquiries are reviewed directly by our core engineering team.</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
