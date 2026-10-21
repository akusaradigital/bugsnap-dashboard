"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { openPaddleCheckout } from "@/lib/paddle";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  feature?: string;
  onSelectPlan?: (plan: string, isYearly: boolean) => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = "free",
  feature = "upgrade_modal",
  onSelectPlan,
}: UpgradeModalProps) {
  const { t } = useT();
  const [isYearly, setIsYearly] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Track paywall impression for zero-DB sales lead scoring
  useEffect(() => {
    if (!isOpen) return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch("/api/track/paywall-hit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feature }),
      }).catch(() => {});
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, feature, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = async (planName: string) => {
    if (onSelectPlan) {
      onSelectPlan(planName, isYearly);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const opened = await openPaddleCheckout({
        plan: planName,
        isYearly,
        userEmail: user?.email,
        userId: user?.id,
        discountCode: promoCode,
      });
      if (!opened) {
        window.location.href = `/pricing?plan=${planName}&billing=${isYearly ? "yearly" : "monthly"}`;
      }
    } catch {
      window.location.href = `/pricing?plan=${planName}&billing=${isYearly ? "yearly" : "monthly"}`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-4 sm:p-10 my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 sm:top-6 left-4 sm:left-6 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Icon icon="lucide:x" className="w-5 h-5 shrink-0" />
        </button>

        {/* Heading */}
        <div className="text-center pt-2 pb-6">
          <h2 id="upgrade-modal-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Level-up with advanced features
          </h2>
        </div>

        {/* Floating Urgency Banner (Feature 5) */}
        <div className="mb-3 rounded-2xl border border-amber-300 dark:border-amber-800/70 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:zap" className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="font-semibold text-amber-950 dark:text-amber-200">
              {t("upgrade.urgencyBanner")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPromoCode("INDO40");
              setShowPromoInput(true);
            }}
            className="text-amber-800 dark:text-amber-400 font-bold hover:underline shrink-0 text-left sm:text-right"
          >
            {t("upgrade.claimDiscount")}
          </button>
        </div>

        {/* Regional PPP Banner */}
        <div className="mb-4 rounded-2xl border border-[#89BD49]/30 dark:border-[#89BD49]/40 bg-[#89BD49]/10 dark:bg-[#89BD49]/15 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:globe" className="w-3.5 h-3.5 shrink-0 text-[#6B9A35] dark:text-[#A8D666]" />
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>Regional Pricing:</strong> Indonesian creators get 40% off with code <code className="font-mono bg-white dark:bg-neutral-800 px-1 py-0.5 rounded font-bold text-[#6B9A35] dark:text-[#A8D666]">INDO40</code>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPromoCode("INDO40");
              setShowPromoInput(true);
            }}
            className="text-[#6B9A35] dark:text-[#A8D666] font-bold hover:underline shrink-0 text-left sm:text-right"
          >
            Apply Code
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 p-2 gap-3 md:gap-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">

          {/* Free Tier */}
          <div className="p-4 sm:p-8 flex flex-col justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-900/60">
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Free</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">$0</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                Free for everyone
              </p>

              <div className="my-6">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold text-sm cursor-default text-center"
                >
                  {currentPlan === "free" ? "Your current plan" : "Free"}
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-4">
                  Basic features
                </p>
                <ul className="space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center gap-3">
                    <Icon icon="lucide:play-circle" className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />
                    <span>5 captures / week</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon icon="lucide:link" className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />
                    <span>5 Recording Links</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon icon="lucide:clock" className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />
                    <span>5 minute recording time</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon icon="lucide:layout-grid" className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />
                    <span>Connect Jira, Linear and more</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon icon="lucide:code-2" className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />
                    <span>Debug via Console & Network Logs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team / Pro Tier */}
          <div className="p-4 sm:p-8 flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/80 dark:border-neutral-800">
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Team</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                  ${isYearly ? "10" : "14"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  per creator / month
                </span>
              </div>

              {/* Billed yearly toggle */}
              <div className="mt-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isYearly}
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                    isYearly ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 shadow ring-0 transition duration-200 ease-in-out ${
                      isYearly ? "translate-x-4" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Billed yearly {isYearly && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Save ~28% · 2 Months Free)</span>}
                </span>
              </div>

              {/* Promo Code Input */}
              <div className="mt-3 text-xs">
                {!showPromoInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="text-neutral-600 dark:text-neutral-400 hover:text-[#6B9A35] dark:hover:text-[#A8D666] underline flex items-center gap-1"
                  >
                    <span>Have a promo code?</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. INDO40 / LAUNCH50"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-foreground uppercase tracking-wide font-mono focus:outline-none focus:ring-1 focus:ring-[#89BD49]"
                    />
                    {promoCode && (
                      <button
                        type="button"
                        onClick={() => setPromoCode("")}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="my-5">
                <button
                  type="button"
                  onClick={() => handleUpgrade("pro")}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-[0.99] text-white font-bold text-sm transition-all shadow-sm shadow-[#89BD49]/25 hover:shadow text-center flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Upgrade to Team"
                  )}
                </button>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 text-center mt-2">
                  Taxes (VAT / PPN) calculated automatically at checkout.
                </p>

                {/* Trust & Security Badges (Feature 4) */}
                <div className="mt-3.5 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/80 flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <Icon icon="lucide:shield-check" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {t("upgrade.trustPaddle")}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon="lucide:credit-card" className="w-3 h-3 shrink-0" />
                    <span>{t("upgrade.trustCards")}</span>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon="lucide:smartphone" className="w-3 h-3 shrink-0" />
                    <span>{t("upgrade.trustAppleGoogle")}</span>
                  </span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <Icon icon="lucide:shield-check" className="w-3 h-3 shrink-0" />
                    <span>{t("upgrade.trustGuarantee")}</span>
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-4">
                  Everything in Free, and
                </p>
                <ul className="space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center gap-3 font-medium">
                    <Icon icon="lucide:play-circle" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Unlimited Captures & Jams</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <Icon icon="lucide:link" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>150 Recording Links</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <Icon icon="lucide:clock" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>15 minute recording time</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <Icon icon="lucide:sparkles" className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>200 AI bug summaries</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <Icon icon="lucide:shield" className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666] shrink-0" />
                    <span>Access controls & Custom Branding</span>
                  </li>
                </ul>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="text-xs text-[#6B9A35] dark:text-[#A8D666] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAllFeatures ? "Hide feature details" : "See all features"}</span>
                    <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 shrink-0 transition-transform ${showAllFeatures ? "rotate-180" : ""}`} />
                  </button>

                  {showAllFeatures && (
                    <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 animate-in fade-in">
                      <p className="flex items-center gap-1.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Unlimited team workspace seats</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Remove BugSnap watermark</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Custom brand logo & colors</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Webhook triggers for Slack, Discord & Zapier</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Icon icon="lucide:check" className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Priority support response SLA</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Looking for our Enterprise plan?{" "}
          <Link href="/contact" onClick={onClose} className="text-[#6B9A35] dark:text-[#A8D666] font-semibold hover:underline">
            Contact sales
          </Link>
        </div>
      </div>
    </div>
  );
}
