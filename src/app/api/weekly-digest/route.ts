import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

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
      if (s.error) throw s.error;
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

    for (const digest of digests) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "BugSnap <no-reply@bugsnap.akusaraproject.my.id>",
          to: [digest.email],
          subject: `BugSnap Weekly Digest - ${digest.workspace}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px;"><img src="${appUrl}/icon.png" width="40" height="40" alt="BugSnap" style="display:block;margin-bottom:20px;" /><h2 style="font-size:20px;font-weight:600;color:#0f172a;margin-top:0;">BugSnap Weekly Digest</h2><p style="color:#475569;font-size:15px;line-height:24px;"><strong>${digest.workspace}</strong> activity over the last 7 days.</p><blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #3b82f6;background-color:#f8fafc;color:#1e293b;font-size:15px;border-radius:0 4px 4px 0;">${digest.captures} captures · ${digest.videos} videos · ${digest.comments} comments · ${digest.views} views</blockquote><hr style="margin:24px 0;border:0;border-top:1px solid #e2e8f0;" /><p style="color:#94a3b8;font-size:12px;margin-bottom:0;">This is an automated weekly digest from BugSnap.</p></div>`,
        }),
      });
      if (!response.ok) throw new Error(`Resend failed (${response.status})`);
    }

    return NextResponse.json({ ok: true, workspaces: digests.length });
  } catch (error) {
    console.error("Weekly digest failed", error);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
