import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { assertPublicUrl } from "@/lib/safe-url";
import { shouldEscalate, buildEscalationPayload } from "@/lib/error-escalation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";

  const { data: workspaces, error: wsError } = await supabase
    .from("workspace_settings")
    .select("workspace_id, webhook_url, auto_escalate_errors, error_escalation_threshold")
    .eq("auto_escalate_errors", true)
    .not("webhook_url", "is", null)
    .neq("webhook_url", "");

  if (wsError) {
    console.error("[Cron escalate-errors] Failed to fetch workspace settings:", wsError);
    return NextResponse.json({ ok: false, error: "Failed to fetch workspace settings" }, { status: 500 });
  }

  let workspacesChecked = 0;
  let escalationsSent = 0;

  for (const ws of workspaces ?? []) {
    try {
      workspacesChecked++;
      const threshold = ws.error_escalation_threshold || 5;

      // get_workspace_fingerprint_counts is SECURITY INVOKER, but the service
      // role has BYPASSRLS - the function runs as the calling role regardless
      // of SECURITY INVOKER/DEFINER, so it sees every workspace exactly like a
      // direct table query would (verified empirically against the live DB
      // before relying on it here). It already does the GROUP BY as an
      // index-only scan on idx_captures_workspace_fingerprint, and already
      // returns affected_users - pulling raw capture rows into Node to
      // re-aggregate by hand would be slower AND, with any row cap, wrong for
      // a workspace whose fingerprinted-capture count exceeds that cap.
      const { data: counts, error: countsError } = await supabase.rpc(
        "get_workspace_fingerprint_counts",
        { p_workspace_id: ws.workspace_id },
      );

      if (countsError || !counts) {
        console.warn(`[Cron escalate-errors] Failed to fetch fingerprint counts for workspace ${ws.workspace_id}:`, countsError);
        continue;
      }

      const recurringFPs = (counts as { error_fingerprint: string; occurrences: number; affected_users: number; last_seen: string }[])
        .map((row) => ({
          fingerprint: row.error_fingerprint,
          occurrences: Number(row.occurrences),
          affectedUsers: Number(row.affected_users),
          lastSeen: row.last_seen,
        }));

      if (recurringFPs.length === 0) continue;

      const { data: existingEscalations, error: escError } = await supabase
        .from("error_escalations")
        .select("error_fingerprint, last_escalated_count, last_escalated_at")
        .eq("workspace_id", ws.workspace_id);

      if (escError) {
        console.warn(`[Cron escalate-errors] Failed to fetch error_escalations for workspace ${ws.workspace_id}:`, escError);
        continue;
      }

      const escalationMap = new Map<string, number>();
      for (const row of existingEscalations ?? []) {
        escalationMap.set(row.error_fingerprint, Number(row.last_escalated_count));
      }

      for (const item of recurringFPs) {
        const lastCount = escalationMap.has(item.fingerprint) ? escalationMap.get(item.fingerprint)! : null;
        if (!shouldEscalate(item.occurrences, threshold, lastCount)) {
          continue;
        }

        const { data: repCaptures, error: repError } = await supabase
          .from("captures")
          .select("id, title, site_url")
          .eq("workspace_id", ws.workspace_id)
          .eq("error_fingerprint", item.fingerprint)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(1);

        if (repError || !repCaptures || repCaptures.length === 0) {
          console.warn(`[Cron escalate-errors] Could not find representative capture for ${item.fingerprint}`);
          continue;
        }

        const rep = repCaptures[0];
        const captureUrl = `${appUrl}/v/${rep.id}`;

        const payload = buildEscalationPayload({
          title: rep.title,
          siteUrl: rep.site_url,
          occurrences: item.occurrences,
          affectedUsers: item.affectedUsers,
          captureUrl,
          fingerprint: item.fingerprint,
        });

        let target: URL;
        try {
          target = await assertPublicUrl(ws.webhook_url);
        } catch (urlErr) {
          console.warn(`[Cron escalate-errors] Invalid webhook URL for workspace ${ws.workspace_id}:`, urlErr);
          continue;
        }

        const response = await fetch(target, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          console.warn(`[Cron escalate-errors] Webhook failed for workspace ${ws.workspace_id} (${response.status}):`, errText);
          continue;
        }

        const { error: upsertErr } = await supabase
          .from("error_escalations")
          .upsert({
            workspace_id: ws.workspace_id,
            error_fingerprint: item.fingerprint,
            last_escalated_count: item.occurrences,
            last_escalated_at: new Date().toISOString(),
          });

        if (upsertErr) {
          console.error(`[Cron escalate-errors] Failed to record escalation for ${item.fingerprint}:`, upsertErr);
        } else {
          escalationsSent++;
        }
      }
    } catch (wsErr) {
      console.error(`[Cron escalate-errors] Error processing workspace ${ws.workspace_id}:`, wsErr);
    }
  }

  return NextResponse.json({ ok: true, workspacesChecked, escalationsSent });
}
