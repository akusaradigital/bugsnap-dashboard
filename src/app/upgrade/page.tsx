"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normalizePlan, type Plan } from "@/lib/tiers";
import { openPaddleCheckout, getAddonPriceId } from "@/lib/paddle";
import { useT } from "@/components/I18nProvider";

function UpgradeContent() {
  const { t } = useT();
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<Plan>("free");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u?.email) return;
      setCurrentUser({ id: u.id, email: u.email });
      let p: Plan = normalizePlan(u.user_metadata?.plan);
      const { data: row } = await supabase
        .from("users")
        .select("plan")
        .ilike("email", u.email)
        .maybeSingle();
      if (row?.plan) p = normalizePlan(row.plan);
      setUserPlan(p);
    });
  }, []);

  const handleUpgrade = async (planName: string) => {
    setLoading(true);
    try {
      const opened = await openPaddleCheckout({
        plan: planName,
        isYearly,
        userEmail: currentUser?.email,
        userId: currentUser?.id,
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

  const handleBuyAddon = async (addon: "ai_summaries" | "captures_pack") => {
    setLoading(true);
    try {
      const priceId = getAddonPriceId(addon);
      const opened = await openPaddleCheckout({
        priceId,
        userEmail: currentUser?.email,
        userId: currentUser?.id,
        discountCode: promoCode,
      });
      if (!opened) {
        window.location.href = `/contact?topic=addon_${addon}`;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/settings");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-foreground flex flex-col justify-between p-4 sm:p-10 relative">
      {/* Top bar with Close button */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Level-up with advanced features
          </h1>
        </div>

        {/* Floating Urgency Banner (Feature 5) */}
        <div className="mb-4 rounded-2xl border border-amber-300 dark:border-amber-800/70 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
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
            {t("upgrade.claimDiscount")} →
          </button>
        </div>

        {/* Purchasing Power Parity (PPP) Banner */}
        <div className="mb-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🌏</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>Regional Pricing:</strong> Indonesian & regional creators get 40% off with coupon code <code className="font-mono bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded font-bold text-indigo-600 dark:text-indigo-400">INDO40</code>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPromoCode("INDO40");
              setShowPromoInput(true);
            }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 text-left sm:text-right"
          >
            Apply Code
          </button>
        </div>

        {/* Student & OSS Discount Banner (Feature 2) */}
        <div className="mb-6 rounded-2xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🎓</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              <strong>Education & OSS:</strong> {t("upgrade.studentBanner")} <code className="font-mono bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded font-bold text-sky-600 dark:text-sky-400">STUDENT50</code>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPromoCode("STUDENT50");
              setShowPromoInput(true);
            }}
            className="text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0 text-left sm:text-right"
          >
            {t("upgrade.applyStudent")}
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 p-2 gap-3 md:gap-0 md:divide-x divide-neutral-200 dark:divide-neutral-800 shadow-sm">
          {/* Free Tier */}
          <div className="p-6 sm:p-8 flex flex-col justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-900/60">
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Free</h2>
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
                  {userPlan === "free" ? "Your current plan" : "Free"}
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-4">
                  Basic features
                </p>
                <ul className="space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>5 captures / week</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>5 Recording Links</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>5 minute recording time</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>Connect Jira, Linear and more</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Debug via Console & Network Logs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team / Pro Tier */}
          <div className="p-6 sm:p-8 flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/80 dark:border-neutral-800">
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Team</h2>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                  ${isYearly ? "10" : "14"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  per creator / month
                </span>
              </div>

              {/* Billed yearly toggle with 2 Months Free */}
              <div className="mt-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2.5">
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
              <div className="mt-4 text-xs">
                {!showPromoInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline flex items-center gap-1"
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
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-foreground uppercase tracking-wide font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {promoCode && (
                      <button
                        type="button"
                        onClick={() => setPromoCode("")}
                        className="text-neutral-400 hover:text-neutral-600 text-xs shrink-0"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-[#a3e635] hover:bg-[#93d625] active:scale-[0.99] text-neutral-950 font-bold text-sm transition-all shadow-sm hover:shadow text-center flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Upgrade to Team"
                  )}
                </button>
                <p className="text-[11px] text-neutral-400 text-center mt-2">
                  Taxes (VAT / PPN) calculated automatically at checkout.
                </p>

                {/* Trust & Security Badges (Feature 4) */}
                <div className="mt-3.5 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/80 flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {t("upgrade.trustPaddle")}
                  </span>
                  <span>·</span>
                  <span>💳 {t("upgrade.trustCards")}</span>
                  <span>·</span>
                  <span>🍏 {t("upgrade.trustAppleGoogle")}</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">↩️ {t("upgrade.trustGuarantee")}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-4">
                  Everything in Free, and
                </p>
                <ul className="space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Unlimited Captures & Jams</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>150 Recording Links</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>15 minute recording time</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>200 AI bug summaries</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <span>Access controls & Custom Branding</span>
                  </li>
                </ul>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>{showAllFeatures ? "Hide feature details" : "See all features"}</span>
                    <svg className={`w-3.5 h-3.5 transition-transform ${showAllFeatures ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAllFeatures && (
                    <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 animate-in fade-in">
                      <p>✓ Unlimited team workspace seats</p>
                      <p>✓ Remove BugSnap watermark</p>
                      <p>✓ Custom brand logo & colors</p>
                      <p>✓ Webhook triggers for Slack, Discord & Zapier</p>
                      <p>✓ Priority support response SLA</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Plan Bar for scrolling (Feature 2) */}
        <div className="sticky top-4 z-20 mt-6 p-3.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              {t("upgrade.stickyHeader")}
            </span>
            <span className="text-[11px] sm:text-xs text-neutral-500 font-medium">
              · Team: ${isYearly ? "10" : "14"}/mo
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUpgrade("pro")}
            disabled={loading}
            className="px-4 py-1.5 rounded-xl bg-[#a3e635] hover:bg-[#93d625] active:scale-95 text-neutral-950 font-bold text-xs shadow-xs transition-all"
          >
            {loading ? "..." : "Upgrade to Team"}
          </button>
        </div>

        {/* Limited Lifetime Deal Card (Feature 4) */}
        <div className="mt-8 rounded-3xl border-2 border-indigo-500/40 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-background dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-neutral-900/40 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                  Early Supporter LTD
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  🔥 27/100 spots remaining
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                {t("upgrade.lifetimeDeal")}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
                {t("upgrade.lifetimeDesc")}
              </p>
            </div>
            <div className="flex flex-col sm:items-end shrink-0 gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                  {t("upgrade.lifetimePrice")}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  / {t("upgrade.lifetimeOneTime")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpgrade("pro")}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 text-center"
              >
                {t("upgrade.lifetimeCta")}
              </button>
            </div>
          </div>
        </div>

        {/* Top-Up Add-on Packs */}
        <div className="mt-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Need a one-time quota boost without subscription?</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Top-up additional quota anytime. Never expires.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleBuyAddon("ai_summaries")}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-indigo-500 transition-colors shadow-sm"
              >
                +100 AI Summaries ($3)
              </button>
              <button
                type="button"
                onClick={() => handleBuyAddon("captures_pack")}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-indigo-500 transition-colors shadow-sm"
              >
                +50 Captures Pack ($5)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full text-center text-xs text-neutral-500 dark:text-neutral-400 py-4">
        Looking for our Enterprise plan?{" "}
        <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          Contact sales
        </Link>
      </footer>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">Loading upgrade details…</div>}>
      <UpgradeContent />
    </Suspense>
  );
}
