import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { renderWeeklyDigestEmail, renderAdminDigestEmail } from "@/lib/email-templates";
import { getSuperAdminEmails } from "@/lib/admin-auth";

export const runtime = "nodejs";

type Workspace = { id: string; name: string; owner_user_id: string | null };

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

    // Piggyback the admin ops summary on this same weekly cron run instead of
    // adding a second Vercel cron entry - the plan's cron slot count is limited
    // and this already fires on the right schedule.
    try {
      const [{ count: newSignups }, { count: newCaptures }, { count: openTickets }, { count: securityAlerts }] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("captures").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase
          .from("security_audit_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since)
          .in("type", ["honeypot_trap", "spam_email", "turnstile_fail"]),
      ]);

      if (process.env.RESEND_API_KEY) {
        const adminEmails = getSuperAdminEmails();
        const digestEmail = renderAdminDigestEmail({
          appUrl,
          newSignups: newSignups ?? 0,
          newCaptures: newCaptures ?? 0,
          openTickets: openTickets ?? 0,
          securityAlerts: securityAlerts ?? 0,
        });
        await Promise.allSettled(
          adminEmails.map((email) =>
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
              body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || "BugSnap <no-reply@bugsnap.akusaraproject.my.id>",
                to: [email],
                subject: digestEmail.subject,
                html: digestEmail.html,
              }),
            })
          )
        );
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
