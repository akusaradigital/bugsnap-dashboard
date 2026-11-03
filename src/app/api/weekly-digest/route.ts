import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import {
  renderWeeklyDigestEmail,
  renderAdminDigestEmail,
  renderMonthlyAdminDigestEmail,
  type StatWithDelta,
} from "@/lib/email-templates";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Workspace = { id: string; name: string; owner_user_id: string | null };

const SECURITY_ALERT_TYPES = ["honeypot_trap", "spam_email", "turnstile_fail"];

async function countRange(
  supabase: SupabaseClient,
  table: string,
  dateCol: string,
  from: string,
  to: string,
  typeFilter?: string
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).gte(dateCol, from).lt(dateCol, to);
  if (typeFilter) query = query.eq("type", typeFilter);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function securityAlertsRange(supabase: SupabaseClient, from: string, to: string): Promise<number> {
  const { count, error } = await supabase
    .from("security_audit_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", from)
    .lt("created_at", to)
    .in("type", SECURITY_ALERT_TYPES);
  if (error) throw error;
  return count ?? 0;
}

function withDelta(current: number, previous: number): StatWithDelta {
  return { value: current, delta: current - previous };
}

async function topWorkspacesByCaptures(
  supabase: SupabaseClient,
  since: string
): Promise<{ name: string; captures: number }[]> {
  const { data: captures, error } = await supabase
    .from("captures")
    .select("workspace_id")
    .gte("created_at", since)
    .not("workspace_id", "is", null)
    .limit(10000);
  if (error) throw error;

  const counts = new Map<string, number>();
  (captures ?? []).forEach((c: { workspace_id: string | null }) => {
    if (c.workspace_id) counts.set(c.workspace_id, (counts.get(c.workspace_id) ?? 0) + 1);
  });
  const topIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (!topIds.length) return [];

  const { data: workspaceRows, error: wsError } = await supabase
    .from("workspaces")
    .select("id,name")
    .in("id", topIds.map(([id]) => id));
  if (wsError) throw wsError;
  const nameById = new Map((workspaceRows ?? []).map((w: { id: string; name: string }) => [w.id, w.name]));
  return topIds.map(([id, captures]) => ({ name: nameById.get(id) ?? "Unknown", captures }));
}

async function planDistribution(supabase: SupabaseClient) {
  const plans = ["free", "pro", "team", "enterprise"] as const;
  const counts = await Promise.all(
    plans.map((plan) => supabase.from("users").select("id", { count: "exact", head: true }).eq("plan", plan))
  );
  return {
    free: counts[0].count ?? 0,
    pro: counts[1].count ?? 0,
    team: counts[2].count ?? 0,
    enterprise: counts[3].count ?? 0,
  };
}

// Weekly digest: one SECURITY DEFINER RPC per workspace instead of 4 REST
// fetches (captures + 2x .in() scans + users) pulled into Node. T-022.
export async function GET(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    await supabase.rpc("prune_expired_captures");
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const workspaceResult = await supabase.from("workspaces").select("id,name,owner_user_id");
    if (workspaceResult.error) throw workspaceResult.error;

    const workspaces = (workspaceResult.data ?? []) as Workspace[];
    const ownerIds = Array.from(new Set(workspaces.map((w) => w.owner_user_id).filter((id): id is string => !!id)));
    const [ownerResult, ...stats] = await Promise.all([
      ownerIds.length
        ? supabase.from("users").select("id,email,notification_prefs").in("id", ownerIds)
        : Promise.resolve({ data: [], error: null }),
      ...workspaces.map((w) => supabase.rpc("weekly_stats", { p_workspace_id: w.id, p_since: since })),
    ]);
    if (ownerResult.error) throw ownerResult.error;
    const ownerEmails = new Map((ownerResult.data ?? []).map((owner) => [owner.id, owner.email]));
    const ownerDigestOptIn = new Map((ownerResult.data ?? []).map((owner) => [owner.id, owner.notification_prefs?.digest !== false]));

    const digests = workspaces.flatMap((workspace, i) => {
      const email = workspace.owner_user_id ? ownerEmails.get(workspace.owner_user_id) : null;
      if (!email || !ownerDigestOptIn.get(workspace.owner_user_id!)) return [];
      const s = stats[i];
      if (s.error) {
        console.error(`Stats RPC error for workspace ${workspace.id}:`, s.error);
        return [];
      }
      const v = (s.data ?? {}) as { captures?: number; videos?: number; comments?: number; views?: number };
      return [{
        email,
        workspace: workspace.name,
        captures: v.captures ?? 0,
        videos: v.videos ?? 0,
        comments: v.comments ?? 0,
        views: v.views ?? 0,
      }];
    });

    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, dryRun: true, workspaces: digests.length });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";

    let sentCount = 0;
    for (const digest of digests) {
      try {
        const emailContent = renderWeeklyDigestEmail({
          appUrl,
          workspaceName: digest.workspace,
          captures: digest.captures,
          videos: digest.videos,
          comments: digest.comments,
          views: digest.views,
        });

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "BugSnap <no-reply@bugsnap.akusaraproject.my.id>",
            to: [digest.email],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        });
        if (!response.ok) {
          console.error(`Resend failed for ${digest.email} (${response.status})`);
        } else {
          sentCount++;
        }
      } catch (sendErr) {
        console.error(`Failed to send digest to ${digest.email}:`, sendErr);
      }
    }

    // Piggyback the admin ops summary (and, once a month, a monthly rollup)
    // on this same weekly cron run instead of adding more Vercel cron entries -
    // the Hobby plan's 2-cron limit is already spent on this job + cleanup-captures.
    try {
      const targetAdminEmail = process.env.ADMIN_DIGEST_EMAIL || "contact.akusaraproject@gmail.com";
      const sendAdminEmail = async (subject: string, html: string) => {
        if (!process.env.RESEND_API_KEY) return;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "BugSnap <no-reply@bugsnap.akusaraproject.my.id>",
            to: [targetAdminEmail],
            subject,
            html,
          }),
        });
      };

      const now = new Date();
      const prevWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const nowIso = now.toISOString();

      const [
        newSignups,
        prevSignups,
        newWorkspaces,
        prevWorkspaces,
        newCaptures,
        prevCaptures,
        newScreenshots,
        prevScreenshots,
        newRecordings,
        prevRecordings,
        newComments,
        prevComments,
        newViews,
        prevViews,
        securityAlerts,
        prevSecurityAlerts,
        { count: openTickets },
      ] = await Promise.all([
        countRange(supabase, "users", "created_at", since, nowIso),
        countRange(supabase, "users", "created_at", prevWeekStart, since),
        countRange(supabase, "workspaces", "created_at", since, nowIso),
        countRange(supabase, "workspaces", "created_at", prevWeekStart, since),
        countRange(supabase, "captures", "created_at", since, nowIso),
        countRange(supabase, "captures", "created_at", prevWeekStart, since),
        countRange(supabase, "captures", "created_at", since, nowIso, "screenshot"),
        countRange(supabase, "captures", "created_at", prevWeekStart, since, "screenshot"),
        countRange(supabase, "captures", "created_at", since, nowIso, "video"),
        countRange(supabase, "captures", "created_at", prevWeekStart, since, "video"),
        countRange(supabase, "comments", "created_at", since, nowIso),
        countRange(supabase, "comments", "created_at", prevWeekStart, since),
        countRange(supabase, "capture_views", "viewed_at", since, nowIso),
        countRange(supabase, "capture_views", "viewed_at", prevWeekStart, since),
        securityAlertsRange(supabase, since, nowIso),
        securityAlertsRange(supabase, prevWeekStart, since),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);

      const weeklyEmail = renderAdminDigestEmail({
        appUrl,
        newSignups: withDelta(newSignups, prevSignups),
        newWorkspaces: withDelta(newWorkspaces, prevWorkspaces),
        newCaptures: withDelta(newCaptures, prevCaptures),
        newScreenshots: withDelta(newScreenshots, prevScreenshots),
        newRecordings: withDelta(newRecordings, prevRecordings),
        newComments: withDelta(newComments, prevComments),
        newViews: withDelta(newViews, prevViews),
        openTickets: openTickets ?? 0,
        securityAlerts: withDelta(securityAlerts, prevSecurityAlerts),
      });
      await sendAdminEmail(weeklyEmail.subject, weeklyEmail.html);

      // This cron runs every Monday - send the monthly rollup only on the
      // first Monday of the month (date <= 7) so it fires once per month.
      if (now.getUTCDate() <= 7) {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

        const [
          mSignups,
          mPrevSignups,
          mWorkspaces,
          mPrevWorkspaces,
          mCaptures,
          mPrevCaptures,
          mScreenshots,
          mPrevScreenshots,
          mRecordings,
          mPrevRecordings,
          mComments,
          mPrevComments,
          mViews,
          mPrevViews,
          mSecurityAlerts,
          mPrevSecurityAlerts,
          workspaces5,
          plans,
        ] = await Promise.all([
          countRange(supabase, "users", "created_at", monthAgo, nowIso),
          countRange(supabase, "users", "created_at", twoMonthsAgo, monthAgo),
          countRange(supabase, "workspaces", "created_at", monthAgo, nowIso),
          countRange(supabase, "workspaces", "created_at", twoMonthsAgo, monthAgo),
          countRange(supabase, "captures", "created_at", monthAgo, nowIso),
          countRange(supabase, "captures", "created_at", twoMonthsAgo, monthAgo),
          countRange(supabase, "captures", "created_at", monthAgo, nowIso, "screenshot"),
          countRange(supabase, "captures", "created_at", twoMonthsAgo, monthAgo, "screenshot"),
          countRange(supabase, "captures", "created_at", monthAgo, nowIso, "video"),
          countRange(supabase, "captures", "created_at", twoMonthsAgo, monthAgo, "video"),
          countRange(supabase, "comments", "created_at", monthAgo, nowIso),
          countRange(supabase, "comments", "created_at", twoMonthsAgo, monthAgo),
          countRange(supabase, "capture_views", "viewed_at", monthAgo, nowIso),
          countRange(supabase, "capture_views", "viewed_at", twoMonthsAgo, monthAgo),
          securityAlertsRange(supabase, monthAgo, nowIso),
          securityAlertsRange(supabase, twoMonthsAgo, monthAgo),
          topWorkspacesByCaptures(supabase, monthAgo),
          planDistribution(supabase),
        ]);

        const monthlyEmail = renderMonthlyAdminDigestEmail({
          appUrl,
          newSignups: withDelta(mSignups, mPrevSignups),
          newWorkspaces: withDelta(mWorkspaces, mPrevWorkspaces),
          newCaptures: withDelta(mCaptures, mPrevCaptures),
          newScreenshots: withDelta(mScreenshots, mPrevScreenshots),
          newRecordings: withDelta(mRecordings, mPrevRecordings),
          newComments: withDelta(mComments, mPrevComments),
          newViews: withDelta(mViews, mPrevViews),
          securityAlerts: withDelta(mSecurityAlerts, mPrevSecurityAlerts),
          topWorkspaces: workspaces5,
          planDistribution: plans,
        });
        await sendAdminEmail(monthlyEmail.subject, monthlyEmail.html);
      }
    } catch (adminDigestErr) {
      console.error("Admin ops digest failed (per-workspace digests already sent):", adminDigestErr);
    }

    return NextResponse.json({ ok: true, workspaces: digests.length, sent: sentCount });
  } catch (error) {
    console.error("Weekly digest failed", error);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
