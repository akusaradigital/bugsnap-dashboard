import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("captures")
      .select("id, workspace_id, site_url, error_fingerprint, created_at")
      .not("error_fingerprint", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw error;

    const map = new Map<
      string,
      {
        fingerprint: string;
        count: number;
        workspaces: Set<string>;
        sampleSiteUrl: string | null;
        sampleCaptureId: string | null;
        firstSeenAt: string;
        lastSeenAt: string;
      }
    >();

    for (const row of data || []) {
      const fp = row.error_fingerprint as string;
      if (!fp) continue;

      let entry = map.get(fp);
      if (!entry) {
        entry = {
          fingerprint: fp,
          count: 0,
          workspaces: new Set<string>(),
          sampleSiteUrl: row.site_url || null,
          sampleCaptureId: row.id || null,
          firstSeenAt: row.created_at,
          lastSeenAt: row.created_at,
        };
        map.set(fp, entry);
      }

      entry.count++;
      if (row.workspace_id) entry.workspaces.add(row.workspace_id);
      if (!entry.sampleSiteUrl && row.site_url) entry.sampleSiteUrl = row.site_url;
      if (!entry.sampleCaptureId && row.id) entry.sampleCaptureId = row.id;
      if (new Date(row.created_at).getTime() < new Date(entry.firstSeenAt).getTime()) {
        entry.firstSeenAt = row.created_at;
      }
    }

    const spikes = Array.from(map.values())
      .map((e) => ({
        fingerprint: e.fingerprint,
        count: e.count,
        workspaceCount: e.workspaces.size,
        sampleSiteUrl: e.sampleSiteUrl,
        sampleCaptureId: e.sampleCaptureId,
        firstSeenAt: e.firstSeenAt,
        lastSeenAt: e.lastSeenAt,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    const totalOccurrences = (data || []).length;

    return NextResponse.json({
      ok: true,
      spikes,
      totalOccurrences,
      distinctFingerprints: map.size,
    });
  } catch (err) {
    console.error("[Admin Error Spikes API] GET Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
