"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";

interface RevenueData {
  metrics: {
    totalUsers: number;
    payingCustomersCount: number;
    freeUsersCount: number;
    conversionRate: string;
    mrr: number;
    arr: number;
    planCounts: {
      free: number;
      pro: number;
      pro_plus: number;
      team: number;
      enterprise: number;
    };
    viralSignupsCount?: number;
    extActive7d?: number;
    extActiveTotal?: number;
  };
  payingCustomers: Array<{
    id: string;
    email: string;
    full_name: string | null;
    plan: string;
    monthlyValue: number;
    created_at: string;
    suspended: boolean;
  }>;
  hotProspects?: Array<{
    id: string;
    email: string;
    full_name: string | null;
    paywall_hits: number;
    last_paywall_feature: string;
    last_paywall_at: string | null;
    created_at: string;
  }>;
  abandonedCheckouts?: Array<{
    id: string;
    email: string;
    full_name: string | null;
    attempted_plan: string;
    checkout_status: string;
    checkout_initiated_at: string | null;
    created_at: string;
  }>;
  stripeStatus: {
    configured: boolean;
    hasSecretKey: boolean;
    hasWebhookSecret: boolean;
  };
}

export default function AdminRevenuePage() {
  const { showToast } = useToast();
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    loadRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRevenue() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/revenue", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

      setData(json);
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  const metrics = data?.metrics;
  const payingCustomers = data?.payingCustomers || [];
  const hotProspects = data?.hotProspects || [];
  const abandonedCheckouts = data?.abandonedCheckouts || [];
  const stripe = data?.stripeStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>💰 {t("admin.revenueTitle")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.revenueDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={loadRevenue}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("admin.mrr")}
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${metrics?.mrr?.toLocaleString() || "0"}
            <span className="text-xs font-normal text-slate-400"> /mo</span>
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Annual Run Rate: ${metrics?.arr?.toLocaleString() || "0"}
          </span>
        </div>

        {/* Paying Customers */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("admin.payingUsers")}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics?.payingCustomersCount || 0}
          </p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 block">
            {metrics?.conversionRate} conversion rate
          </span>
        </div>

        {/* Free Tier Accounts */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("admin.freeTier")}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics?.freeUsersCount || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            of {metrics?.totalUsers || 0} total accounts
          </span>
        </div>

        {/* Stripe Gateway Status */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Stripe Integration
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                stripe?.configured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              {stripe?.configured ? "Active & Linked" : "Partially Configured"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Webhook: {stripe?.hasWebhookSecret ? "Verified ✓" : "Pending Key"}
          </span>
        </div>
      </div>

      {/* Plan Breakdown & Growth Attribution Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Free Plan</span>
          <p className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5">
            {metrics?.planCounts?.free || 0}
          </p>
          <span className="text-[10px] text-slate-400">$0 / user</span>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Pro Tier</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {metrics?.planCounts?.pro || 0}
          </p>
          <span className="text-[10px] text-slate-400">$12 / mo</span>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <span className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">Team / Pro+</span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {(metrics?.planCounts?.pro_plus || 0) + (metrics?.planCounts?.team || 0)}
          </p>
          <span className="text-[10px] text-slate-400">$24 / mo</span>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Enterprise</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {metrics?.planCounts?.enterprise || 0}
          </p>
          <span className="text-[10px] text-slate-400">$99+ / mo</span>
        </div>
        {/* Viral loop attribution */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">{t("admin.viralSignups")}</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metrics?.viralSignupsCount || 0}
          </p>
          <span className="text-[10px] text-slate-400">via /v/:id shares</span>
        </div>
        {/* Extension retention */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <span className="text-[10px] uppercase font-bold text-cyan-500 tracking-wider">{t("admin.extRetention")}</span>
          <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
            {metrics?.extActive7d || 0}
            <span className="text-xs font-normal text-slate-400"> / {metrics?.extActiveTotal || 0}</span>
          </p>
          <span className="text-[10px] text-slate-400">Daily Heartbeats</span>
        </div>
      </div>

      {/* Hot Prospects Table (Zero-Overhead High Intent Leads) */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>🔥 {t("admin.hotProspects")} ({hotProspects.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {t("admin.hotProspectsDesc")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Lead</th>
                <th className="py-3 px-4">{t("admin.paywallHits")}</th>
                <th className="py-3 px-4">{t("admin.lastBlockedFeature")}</th>
                <th className="py-3 px-4">Last Encounter</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : hotProspects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No free users have hit quota barriers yet. As users record & hit limits, high-intent leads appear here automatically.
                  </td>
                </tr>
              ) : (
                hotProspects.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lead.full_name || "Free User"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {lead.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        {lead.paywall_hits} {lead.paywall_hits === 1 ? "hit" : "hits"}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {lead.last_paywall_feature}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400 text-[11px]">
                      {lead.last_paywall_at
                        ? new Date(lead.last_paywall_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={`mailto:${lead.email}?subject=Exclusive%20BugSnap%20Pro%20Offer&body=Hi%20${encodeURIComponent(lead.full_name || "")},%20we%20noticed%20you%20were%20exploring%20${encodeURIComponent(lead.last_paywall_feature)}...`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors"
                      >
                        ✉️ {t("admin.contactLead")}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Abandoned Checkouts Table (Stripe Cart Recovery) */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>🛒 {t("admin.abandonedCheckouts")} ({abandonedCheckouts.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {t("admin.abandonedCheckoutsDesc")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Attempted Plan</th>
                <th className="py-3 px-4">{t("admin.cartStatus")}</th>
                <th className="py-3 px-4">Initiated</th>
                <th className="py-3 px-4 text-right">Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : abandonedCheckouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No abandoned checkouts detected. When a user cancels checkout or their session expires, they are flagged here for recovery.
                  </td>
                </tr>
              ) : (
                abandonedCheckouts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cart.full_name || "Prospective Buyer"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {cart.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        {cart.attempted_plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                        {cart.checkout_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400 text-[11px]">
                      {cart.checkout_initiated_at
                        ? new Date(cart.checkout_initiated_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={`mailto:${cart.email}?subject=Need%20help%20completing%20your%20BugSnap%20upgrade%3F&body=Hi%20${encodeURIComponent(cart.full_name || "")},%20we%20noticed%20you%20were%20checking%20out%20the%20${encodeURIComponent(cart.attempted_plan)}%20plan...`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition-colors"
                      >
                        ⚡ Recover Cart
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paying Customers Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Paying Subscribers List ({payingCustomers.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Users currently on paid subscription plans (Pro, Team, Enterprise).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Monthly Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Since</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : payingCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No paying subscribers yet. Upgrades via Stripe will automatically appear here.
                  </td>
                </tr>
              ) : (
                payingCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cust.full_name || "Subscriber"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {cust.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {cust.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      ${cust.monthlyValue} / mo
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {cust.suspended ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(cust.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href="/admin/users"
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Manage User →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
