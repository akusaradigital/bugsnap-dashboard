import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { resolvePlanWithExpiry } from "@/lib/tiers";

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

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    // 1. AI Summaries Analytics
    const { data: aiCaptures, count: totalAiCount, error: aiErr } = await supabase
      .from("captures")
      .select("id, title, created_at, user_id, type", { count: "exact" })
      .not("ai_summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (aiErr) throw aiErr;

    // Estimate token consumption (avg 1,200 tokens per analysis, input + output)
    const totalAiSummaries = totalAiCount || 0;
    const estimatedTokens = totalAiSummaries * 1200;
    const estimatedCostUsd = ((estimatedTokens / 1_000_000) * 1.5).toFixed(3); // ~$1.50 per 1M blended

    // Enrich creators of recent AI summaries
    const userIds = Array.from(new Set((aiCaptures || []).map((c) => c.user_id).filter(Boolean)));
    const userEmailMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      (userData || []).forEach((u) => {
        userEmailMap[u.id] = u.email;
      });
    }

    const enrichedAiCaptures = (aiCaptures || []).map((c) => ({
      ...c,
      creator_email: c.user_id ? userEmailMap[c.user_id] || "-" : "-",
    }));

    // Aggregate Top AI Cost Drivers (to catch free-tier abusers / heavy consumption)
    let topDrivers: Array<{
      user_id: string;
      email: string;
      full_name: string;
      plan: string;
      effective_plan: string;
      ai_count: number;
      estimated_tokens: number;
      estimated_cost_usd: string;
      is_leech: boolean;
    }> = [];

    try {
      const { data: allAiUsers } = await supabase
        .from("captures")
        .select("user_id")
        .not("ai_summary", "is", null)
        .not("user_id", "is", null)
        .limit(2500);

      const userAiCounts: Record<string, number> = {};
      (allAiUsers || []).forEach((c) => {
        if (c.user_id) {
          userAiCounts[c.user_id] = (userAiCounts[c.user_id] || 0) + 1;
        }
      });

      const sortedUserIds = Object.entries(userAiCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (sortedUserIds.length > 0) {
        const { data: driversUsers } = await supabase
          .from("users")
          .select("id, email, full_name, plan, plan_expires_at")
          .in("id", sortedUserIds.map(([uid]) => uid));

        const driverMap = new Map((driversUsers || []).map((u) => [u.id, u]));

        topDrivers = sortedUserIds.map(([uid, count]) => {
          const u = driverMap.get(uid);
          const effectivePlan = resolvePlanWithExpiry(u?.plan || "free", u?.plan_expires_at);
          const tokens = count * 1200;
          const cost = ((tokens / 1_000_000) * 1.5).toFixed(3);
          // Flag as leech if high usage on free tier
          const isLeech = effectivePlan === "free" && count >= 5;

          return {
            user_id: uid,
            email: u?.email || "Unknown",
            full_name: u?.full_name || "",
            plan: u?.plan || "free",
            effective_plan: effectivePlan,
            ai_count: count,
            estimated_tokens: tokens,
            estimated_cost_usd: `$${cost}`,
            is_leech: isLeech,
          };
        });
      }
    } catch (e) {
      console.warn("Failed to compute top AI drivers:", e);
    }

    // 2. API Keys Analytics
    let apiKeys: Array<{
      id: string;
      name: string;
      key_prefix: string;
      created_at: string;
      last_used_at: string | null;
      is_active: boolean;
      workspace_name: string;
    }> = [];
    let totalApiKeys = 0;
    let activeApiKeys = 0;

    try {
      const { data: keys, count } = await supabase
        .from("bugsnap_api_keys")
        .select("id, name, key_prefix, created_at, last_used_at, revoked_at, workspace_id, workspaces(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(25);

      apiKeys = (keys || []).map((k: Record<string, unknown>) => ({
        id: String(k.id),
        name: String(k.name || ""),
        key_prefix: String(k.key_prefix || ""),
        created_at: String(k.created_at || ""),
        last_used_at: k.last_used_at ? String(k.last_used_at) : null,
        is_active: !k.revoked_at,
        workspace_name: (k.workspaces as { name?: string } | null)?.name || "-",
      }));

      totalApiKeys = count || 0;
      activeApiKeys = apiKeys.filter((k) => k.is_active).length;
    } catch {
      // table may not exist yet in some environments
    }

    // 3. Webhooks Analytics
    let activeWebhooksCount = 0;
    try {
      const { count } = await supabase
        .from("workspaces")
        .select("id", { count: "exact", head: true })
        .not("webhook_url", "is", null);

      activeWebhooksCount = count || 0;
    } catch {
      // silent
    }

    return NextResponse.json({
      ok: true,
      aiStats: {
        totalSummaries: totalAiSummaries,
        estimatedTokens,
        estimatedCostUsd: `$${estimatedCostUsd}`,
        recentSummaries: enrichedAiCaptures,
        topDrivers,
      },
      apiKeysStats: {
        totalKeys: totalApiKeys,
        activeKeys: activeApiKeys,
        keysList: apiKeys,
      },
      webhooksStats: {
        activeWebhooksCount,
      },
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to load AI analytics";
    console.error("Admin AI analytics error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
