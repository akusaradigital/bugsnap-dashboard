import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";
import { decompressDevLogs } from "@/lib/devlogs-compression";

export const runtime = "nodejs";

// ponytail: extracts human-readable error lines from captured dev_logs
function summarizeDevLogs(devLogs: unknown): string {
  if (!devLogs) return "";
  if (Array.isArray(devLogs)) {
    const errorLogs = devLogs
      .filter((l) => l && typeof l === "object" && (l.type === "console" || l.level === "error" || l.status >= 400))
      .slice(0, 10)
      .map((l) => `- [${l.type || l.level || "error"}] ${l.message || l.text || l.url || JSON.stringify(l)}`);
    return errorLogs.length ? `\n\n### Console & Network Errors\n${errorLogs.join("\n")}` : "";
  }
  if (typeof devLogs === "object") {
    const summary = devLogs as { topErrors?: string[]; failedRequests?: number; errors?: number };
    const parts: string[] = [];
    if (summary.errors) parts.push(`Errors count: ${summary.errors}`);
    if (summary.failedRequests) parts.push(`Failed requests: ${summary.failedRequests}`);
    if (Array.isArray(summary.topErrors) && summary.topErrors.length) {
      parts.push(`Top errors:\n${summary.topErrors.map((e) => `- ${e}`).join("\n")}`);
    }
    return parts.length ? `\n\n### DevTools Summary\n${parts.join("\n")}` : "";
  }
  return "";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await authenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await Promise.resolve(params);
    const supabase = createServiceClient();

    // 1. Fetch capture
    const { data: capture, error: capError } = await supabase
      .from("captures")
      .select("id, title, description, type, drive_url, dev_logs, os, browser, site_url, window_size, workspace_id, project_id")
      .eq("id", id)
      .maybeSingle();

    if (capError) throw capError;
    if (!capture) return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    if (!capture.workspace_id) return NextResponse.json({ error: "Capture is not assigned to a workspace" }, { status: 400 });

    // 2. Confirm user is a team member
    const { data: membership, error: memError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", capture.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memError) throw memError;
    if (!membership) return NextResponse.json({ error: "Access denied to capture workspace" }, { status: 403 });

    // 3. Read workspace settings for Aksora integration credentials
    const { data: wsSettings, error: wsError } = await supabase
      .from("workspace_settings")
      .select("integrations")
      .eq("workspace_id", capture.workspace_id)
      .maybeSingle();

    if (wsError) throw wsError;

    const integrations = (wsSettings?.integrations as Record<string, { url?: string; apiKey?: string }>) || {};
    const aksora = integrations.aksora;

    if (!aksora?.url || !aksora?.apiKey) {
      return NextResponse.json(
        { error: "Aksora integration is not configured in workspace settings. Please configure URL and API key first." },
        { status: 400 }
      );
    }

    // 4. Build task payload for Aksora public API
    // ponytail: stuffing dev_logs & env into description text — Aksora Task has no native columns for them
    const envParts = [
      capture.os ? `OS: ${capture.os}` : null,
      capture.browser ? `Browser: ${capture.browser}` : null,
      capture.window_size ? `Viewport: ${capture.window_size}` : null,
      capture.site_url ? `URL: ${capture.site_url}` : null,
    ].filter(Boolean);

    const envBlock = envParts.length ? `\n\n### Environment\n${envParts.map((p) => `- ${p}`).join("\n")}` : "";
    const rawLogs = capture.dev_logs;
    const resolvedLogs = typeof rawLogs === "string" && rawLogs.startsWith("gz:")
      ? await decompressDevLogs(rawLogs)
      : rawLogs;
    const logSummary = summarizeDevLogs(resolvedLogs);
    const fullDescription = `${capture.description || "Bug report captured via BugSnap."}${envBlock}${logSummary}\n\n[View BugSnap Capture](${capture.drive_url || ""})`;

    const taskPayload = {
      title: `[BugSnap] ${capture.title || "Captured Bug"}`,
      project: "General",
      relatedFeature: "BugSnap Capture",
      category: "Bug Fix",
      status: "todo",
      priority: "P1",
      description: fullDescription,
      acceptanceCriteria: "Verify bug reported in BugSnap capture is resolved.",
      evidence: capture.drive_url || undefined,
    };

    const targetUrl = `${aksora.url.replace(/\/+$/, "")}/api/public/v1/tasks`;
    const aksoraRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aksora.apiKey}`,
      },
      body: JSON.stringify({ data: taskPayload }),
    });

    const aksoraData = await aksoraRes.json().catch(() => ({}));

    if (!aksoraRes.ok) {
      return NextResponse.json(
        { error: aksoraData.error || `Aksora responded with status ${aksoraRes.status}` },
        { status: aksoraRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: aksoraData.message || "Task created in Aksora successfully",
      aksoraResponse: aksoraData,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send capture to Aksora" },
      { status: 500 }
    );
  }
}
