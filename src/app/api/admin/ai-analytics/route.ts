import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { resolvePlanWithExpiry } from "@/lib/tiers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    // 1. Real AI usage (tokens + hit counts) - one row per actual LLM call,
    // logged by the extension's AI Polish button, the dashboard's AI Clue
    // button, and the admin ping/test-polish actions. Replaces the old flat
    // "1200 tokens x count(captures.ai_summary)" guess, which also never saw
    // AI Polish calls at all since those never touch the captures table.
    const { data: usageRows } = await supabase
      .from("ai_usage_logs")
      .select("source, user_email, total_tokens, success, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    const rows = usageRows || [];
    const totalAiCalls = rows.length;
    const totalTokens = rows.reduce((sum, r) => sum + (r.total_tokens || 0), 0);
    const estimatedCostUsd = ((totalTokens / 1_000_000) * 1.5).toFixed(3); // ~$1.50 per 1M blended

    // Recent AI-analyzed captures (AI Clue), shown in the "Recent AI Bug
    // Reports" table - a different view (which captures, not how much spent).
    const { data: aiCaptures } = await supabase
      .from("captures")
      .select("id, title, created_at, user_id, type")
      .not("ai_summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

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

    // Aggregate Top AI Cost Drivers per account (to catch free-tier abusers /
    // heavy consumption). Only real end-user activity counts here - the
    // admin's own ping/test-polish clicks are excluded so they don't show up
    // as a "leech" account.
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
      const perUser: Record<string, { count: number; tokens: number }> = {};
      for (const r of rows) {
        if (!r.user_email) continue;
        if (r.source !== "extension_polish" && r.source !== "ai_clue") continue;
        const stat = (perUser[r.user_email] ||= { count: 0, tokens: 0 });
        stat.count += 1;
        stat.tokens += r.total_tokens || 0;
      }

      const sortedEmails = Object.entries(perUser)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);

      if (sortedEmails.length > 0) {
        const { data: driversUsers } = await supabase
          .from("users")
          .select("id, email, full_name, plan, plan_expires_at")
          .in("email", sortedEmails.map(([email]) => email));

        const driverMap = new Map((driversUsers || []).map((u) => [(u.email || "").toLowerCase(), u]));

        topDrivers = sortedEmails.map(([email, stat]) => {
          const u = driverMap.get(email);
          const effectivePlan = resolvePlanWithExpiry(u?.plan || "free", u?.plan_expires_at);
          const cost = ((stat.tokens / 1_000_000) * 1.5).toFixed(3);
          // Flag as leech if high usage on free tier
          const isLeech = effectivePlan === "free" && stat.count >= 5;

          return {
            user_id: u?.id || email,
            email: u?.email || email,
            full_name: u?.full_name || "",
            plan: u?.plan || "free",
            effective_plan: effectivePlan,
            ai_count: stat.count,
            estimated_tokens: stat.tokens,
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
        .from("workspace_settings")
        .select("workspace_id", { count: "exact", head: true })
        .not("webhook_url", "is", null)
        .neq("webhook_url", "");

      activeWebhooksCount = count || 0;
    } catch {
      // silent
    }

    return NextResponse.json({
      ok: true,
      aiStats: {
        totalSummaries: totalAiCalls,
        estimatedTokens: totalTokens,
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
