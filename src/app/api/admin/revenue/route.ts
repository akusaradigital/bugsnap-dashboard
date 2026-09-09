import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const getAdminEmails = () =>
  (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

async function checkAdminAuth(req: Request) {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let authorized = isAdminAuthenticated;

  const supabase = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.email) {
      if (getAdminEmails().includes(user.email.toLowerCase())) {
        authorized = true;
      }
    }
  }

  return { authorized, supabase };
}

// Plan monthly pricing estimates in USD
const PLAN_PRICES: Record<string, number> = {
  pro: 12,
  pro_plus: 24,
  team: 24,
  enterprise: 99,
};

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    // Get all users with their plans, sales intent, and retention metrics
    // ponytail: derived purely from single users table, zero external analytics dependencies
    const { data: users, error } = await supabase
      .from("users")
      .select(
        "id, email, full_name, plan, created_at, suspended, paywall_hits, last_paywall_feature, last_paywall_at, checkout_status, last_checkout_plan, checkout_initiated_at, referred_by_capture_id, extension_last_seen, extension_version"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const allUsers = users || [];
    const totalUsers = allUsers.length;

    // Distribution
    const planCounts: Record<string, number> = {
      free: 0,
      pro: 0,
      pro_plus: 0,
      team: 0,
      enterprise: 0,
    };

    let mrr = 0;
    const payingCustomers: Array<{
      id: string;
      email: string;
      full_name: string | null;
      plan: string;
      monthlyValue: number;
      created_at: string;
      suspended: boolean;
    }> = [];

    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    let extActive7d = 0;
    let extActiveTotal = 0;
    let viralSignupsCount = 0;

    allUsers.forEach((u) => {
      const p = (u.plan || "free").toLowerCase();
      if (planCounts[p] !== undefined) {
        planCounts[p] += 1;
      } else {
        planCounts.free += 1;
      }

      const price = PLAN_PRICES[p] || 0;
      if (price > 0) {
        mrr += price;
        payingCustomers.push({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          plan: p,
          monthlyValue: price,
          created_at: u.created_at,
          suspended: u.suspended,
        });
      }

      if (u.referred_by_capture_id) {
        viralSignupsCount += 1;
      }

      if (u.extension_last_seen) {
        extActiveTotal += 1;
        const lastSeenMs = new Date(u.extension_last_seen).getTime();
        if (nowMs - lastSeenMs <= sevenDaysMs) {
          extActive7d += 1;
        }
      }
    });

    // 1. Hot Prospects: free users who actively bumped into paywalls
    const hotProspects = allUsers
      .filter((u) => (u.plan || "free").toLowerCase() === "free" && (u.paywall_hits || 0) > 0)
      .sort((a, b) => (b.paywall_hits || 0) - (a.paywall_hits || 0))
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        paywall_hits: u.paywall_hits || 0,
        last_paywall_feature: u.last_paywall_feature || "general",
        last_paywall_at: u.last_paywall_at,
        created_at: u.created_at,
      }));

    // 2. Abandoned Checkouts: users who opened checkout but didn't finish
    const abandonedCheckouts = allUsers
      .filter(
        (u) =>
          u.checkout_status === "abandoned" ||
          (u.checkout_status === "initiated" && (u.plan || "free").toLowerCase() === "free")
      )
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        attempted_plan: u.last_checkout_plan || "pro",
        checkout_status: u.checkout_status,
        checkout_initiated_at: u.checkout_initiated_at,
        created_at: u.created_at,
      }));

    const payingCount = payingCustomers.length;
    const conversionRate = totalUsers > 0 ? ((payingCount / totalUsers) * 100).toFixed(1) : "0";
    const arr = mrr * 12;

    // A/B Experiment metrics summary
    // ponytail: pulled directly from existing app_settings blob, zero schema addition
    const { data: abRecord } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ab_experiments_metrics")
      .maybeSingle();

    interface VariantStats {
      impressions?: number;
      conversions?: Record<string, number>;
      last_event_at?: string;
    }

    interface ExpData {
      updated_at?: string;
      variants?: Record<string, VariantStats>;
    }

    const rawAb = (abRecord?.value as Record<string, ExpData>) || {};
    const abExperiments: Record<string, {
      updated_at?: string;
      variants: Record<string, {
        impressions: number;
        total_conversions: number;
        conversion_rate: string;
        conversions_by_goal: Record<string, number>;
        last_event_at?: string;
      }>;
    }> = {};

    for (const [expId, expData] of Object.entries(rawAb)) {
      abExperiments[expId] = {
        updated_at: expData.updated_at,
        variants: {},
      };
      for (const [varId, varStats] of Object.entries(expData.variants || {})) {
        const impressions = varStats.impressions || 0;
        const conversions = Object.values(varStats.conversions || {}).reduce(
          (a, b) => a + b,
          0
        );
        const rate = impressions > 0 ? ((conversions / impressions) * 100).toFixed(1) + "%" : "0.0%";
        abExperiments[expId].variants[varId] = {
          impressions,
          total_conversions: conversions,
          conversion_rate: rate,
          conversions_by_goal: varStats.conversions || {},
          last_event_at: varStats.last_event_at,
        };
      }
    }

    // Check Stripe configuration status
    const hasStripeSecret = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasStripeWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

    return NextResponse.json({
      ok: true,
      metrics: {
        totalUsers,
        payingCustomersCount: payingCount,
        freeUsersCount: planCounts.free,
        conversionRate: `${conversionRate}%`,
        mrr,
        arr,
        planCounts,
        viralSignupsCount,
        extActive7d,
        extActiveTotal,
      },
      payingCustomers,
      hotProspects,
      abandonedCheckouts,
      abExperiments,
      stripeStatus: {
        configured: hasStripeSecret && hasStripeWebhook,
        hasSecretKey: hasStripeSecret,
        hasWebhookSecret: hasStripeWebhook,
      },
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to load revenue metrics";
    console.error("Admin revenue GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
