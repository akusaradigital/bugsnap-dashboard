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
