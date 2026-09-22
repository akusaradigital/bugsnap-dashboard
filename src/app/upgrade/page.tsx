"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normalizePlan, type Plan } from "@/lib/tiers";
import { openPaddleCheckout, getAddonPriceId } from "@/lib/paddle";
import { useT } from "@/components/I18nProvider";
import {
  IconX,
  IconCheck,
  IconBolt,
  IconWorld,
  IconChevronDown,
} from "@/components/site/TablerIcons";

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
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col justify-between p-4 sm:p-10">
      {/* Top bar with Close button */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="p-2 rounded-lg border border-site-border bg-site-surface text-site-text-2 hover:text-site-text shadow-2xs hover:bg-site-surface-2 transition-colors"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text">
            Level-up with advanced features
          </h1>
          <p className="text-xs text-site-text-2">
            Higher limits, team workspaces, and developer-grade debugging tools.
          </p>
        </div>

        {/* Urgency & Regional Banners */}
        <div className="space-y-2.5 text-xs">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-site-text">
            <div className="flex items-center gap-2">
              <IconBolt size={14} className="text-amber-500 shrink-0" />
              <span className="font-semibold text-site-text">
                {t("upgrade.urgencyBanner")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPromoCode("INDO40");
                setShowPromoInput(true);
              }}
              className="text-accent font-semibold hover:underline shrink-0 text-left sm:text-right"
            >
              {t("upgrade.claimDiscount")} →
            </button>
          </div>

          <div className="rounded-lg border border-site-border bg-site-surface p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-site-text">
            <div className="flex items-center gap-2">
              <IconWorld size={14} className="text-site-text-2 shrink-0" />
              <span className="text-site-text-2">
                <strong className="text-site-text">Regional Pricing:</strong> Indonesian & regional creators get 40% off with coupon code <code className="font-mono bg-site-surface-2 px-1.5 py-0.5 rounded text-accent border border-site-border-subtle">INDO40</code>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPromoCode("INDO40");
                setShowPromoInput(true);
              }}
              className="text-accent font-semibold hover:underline shrink-0 text-left sm:text-right"
            >
              Apply Code →
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl border border-site-border bg-site-surface overflow-hidden shadow-xs divide-y md:divide-y-0 md:divide-x divide-site-border">
          {/* Free Tier */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-site-surface">
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-site-text">Free</h2>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-site-text font-mono">$0</span>
              </div>
              <p className="text-xs text-site-text-2 mt-2 pb-4 border-b border-site-border-subtle">
                Free for everyone
              </p>

              <div className="my-6">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-lg bg-site-surface-2 border border-site-border text-site-text-2 font-semibold text-xs cursor-default text-center"
                >
                  {userPlan === "free" ? "Your current plan" : "Free"}
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-site-text mb-3">
                  Basic features
                </p>
                <ul className="space-y-2.5 text-xs text-site-text-2">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>5 captures / week</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>5 Recording Links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>5 minute recording time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>Connect Jira, Linear and more</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>Debug via Console & Network Logs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team / Pro Tier */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-site-surface">
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-site-text">Team</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent text-slate-900">
                  Recommended
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-site-text font-mono">
                  ${isYearly ? "10" : "14"}
                </span>
                <span className="text-xs text-site-text-2 font-medium">
                  per creator / month
                </span>
              </div>

              {/* Billed yearly toggle */}
              <div className="mt-3 pb-4 border-b border-site-border-subtle flex items-center gap-2.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isYearly}
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                    isYearly ? "bg-accent" : "bg-site-surface-2 border border-site-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isYearly ? "translate-x-4" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
                <span className="text-xs text-site-text">
                  Billed yearly {isYearly && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Save ~28% · 2 Months Free)</span>}
                </span>
              </div>

              {/* Promo Code Input */}
              <div className="mt-4 text-xs">
                {!showPromoInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="text-site-text-2 hover:text-site-text underline flex items-center gap-1"
                  >
                    <span>Have a promo code?</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. INDO40 / LAUNCH50"
                      className="w-full px-2.5 py-1.5 rounded-md border border-site-border bg-site-surface text-xs text-site-text uppercase tracking-wide font-mono focus:outline-none focus:border-accent"
                    />
                    {promoCode && (
                      <button
                        type="button"
                        onClick={() => setPromoCode("")}
                        className="text-site-text-2 hover:text-site-text text-xs shrink-0"
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
                  className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 hover:text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Upgrade to Team"
                  )}
                </button>
                <p className="text-[11px] text-site-text-2 text-center mt-2">
                  Taxes (VAT / PPN) calculated automatically at checkout.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-site-text mb-3">
                  Everything in Free, and:
                </p>
                <ul className="space-y-2.5 text-xs text-site-text">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>Unlimited Captures & Jams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>150 Recording Links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>15 minute recording time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>200 AI bug summaries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-accent shrink-0" />
                    <span>Access controls & Custom Branding</span>
                  </li>
                </ul>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>{showAllFeatures ? "Hide feature details" : "See all features"}</span>
                    <IconChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${showAllFeatures ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showAllFeatures && (
                    <ul className="mt-3 p-3 rounded-lg bg-site-surface-2 border border-site-border text-xs text-site-text-2 space-y-2">
                      <li className="flex items-center gap-2">
                        <IconCheck size={13} className="text-accent shrink-0" />
                        <span>Unlimited team workspace seats</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={13} className="text-accent shrink-0" />
                        <span>Remove BugSnap watermark</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={13} className="text-accent shrink-0" />
                        <span>Custom brand logo & colors</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={13} className="text-accent shrink-0" />
                        <span>Webhook triggers for Slack, Discord & Zapier</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={13} className="text-accent shrink-0" />
                        <span>Priority support response SLA</span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Up Add-on Packs */}
        <div className="rounded-xl border border-site-border bg-site-surface p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-site-text">Need a one-time quota boost without subscription?</h3>
              <p className="text-xs text-site-text-2">Top-up additional quota anytime. Never expires.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleBuyAddon("ai_summaries")}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-xs font-semibold text-site-text transition-colors"
              >
                +100 AI Summaries ($3)
              </button>
              <button
                type="button"
                onClick={() => handleBuyAddon("captures_pack")}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-xs font-semibold text-site-text transition-colors"
              >
                +50 Captures Pack ($5)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full text-center text-xs text-site-text-2 py-4">
        Looking for our Enterprise plan?{" "}
        <Link href="/contact" className="text-accent font-semibold hover:underline">
          Contact sales →
        </Link>
      </footer>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-site-text-2 font-mono">Loading upgrade details…</div>}>
      <UpgradeContent />
    </Suspense>
  );
}
