import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isRateLimited } from "@/lib/rate-limit";

export interface SpikeStats {
  count: number;
  workspaceCount: number;
  sampleSiteUrl: string | null;
  sampleCaptureId: string | null;
}

export async function countRecentGlobalOccurrences(
  db: SupabaseClient,
  fingerprint: string,
  windowMinutes = 30
): Promise<SpikeStats> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { data, error } = await db
    .from("captures")
    .select("id, workspace_id, site_url")
    .eq("error_fingerprint", fingerprint)
    .gte("created_at", since);

  if (error || !data) {
    return { count: 0, workspaceCount: 0, sampleSiteUrl: null, sampleCaptureId: null };
  }

  const workspaces = new Set<string>();
  let sampleSiteUrl: string | null = null;
  let sampleCaptureId: string | null = null;

  for (const row of data) {
    if (row.workspace_id) workspaces.add(row.workspace_id);
    if (!sampleSiteUrl && row.site_url) sampleSiteUrl = row.site_url;
    if (!sampleCaptureId && row.id) sampleCaptureId = row.id;
  }

  return {
    count: data.length,
    workspaceCount: workspaces.size,
    sampleSiteUrl,
    sampleCaptureId,
  };
}

export async function maybeAlertAdminOfSpike(
  db: SupabaseClient,
  fingerprint: string,
  siteUrl: string | null
): Promise<void> {
  if (!fingerprint) return;

  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  // Threshold: >= 5 occurrences in 30 min AND >= 2 distinct workspaces (cross-tenant surge)
  const stats = await countRecentGlobalOccurrences(db, fingerprint, 30);
  if (stats.count < 5 || stats.workspaceCount < 2) {
    return;
  }

  // Rate limit: 1 alert per hour per fingerprint
  const limited = await isRateLimited(`admin-spike:${fingerprint}`, 1, 3600);
  if (limited) {
    return;
  }

  const domain = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";
  const captureLink = stats.sampleCaptureId ? `${domain}/c/${stats.sampleCaptureId}` : domain;
  const site = siteUrl || stats.sampleSiteUrl || "unknown";

  const message = `🚨 [BugSnap Incident Alert] Cross-Tenant Error Spike Detected!\n` +
    `• Fingerprint: \`${fingerprint}\`\n` +
    `• Total occurrences (last 30m): ${stats.count}\n` +
    `• Affected workspaces: ${stats.workspaceCount}\n` +
    `• Sample site: ${site}\n` +
    `• Sample capture: ${captureLink}`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: message,
        text: message,
        embeds: [
          {
            title: "🚨 Cross-Tenant Error Spike Detected",
            color: 0xe11d48, // Rose-600
            url: captureLink,
            fields: [
              { name: "Occurrences (30m)", value: String(stats.count), inline: true },
              { name: "Workspaces", value: String(stats.workspaceCount), inline: true },
              { name: "Fingerprint", value: fingerprint.slice(0, 1024), inline: false },
              { name: "Sample Site", value: site, inline: false },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[spike-detector] Failed to dispatch admin webhook:", err);
  }
}
