import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";
import { isUuid } from "@/lib/google-drive-values";
import { decompressDevLogs } from "@/lib/devlogs-compression";
import { normalizeDevLog, isConsoleError, isNetworkFailed, type DevLog, type DevLogSummary, type DriveExternalLogReference } from "@/lib/devlogs";
import { cleanStackTrace, cleanUrlForTelemetry, sanitizePromptData } from "@/lib/redact";
import { signDownload } from "@/lib/download-signing";

export const runtime = "nodejs";

const CONSOLE_CAP = 15;
const NETWORK_CAP = 15;
const STEPS_CAP = 20;

function isDriveExternalLogReference(v: unknown): v is DriveExternalLogReference {
  return !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as { driveFileId?: unknown }).driveFileId === "string";
}

function isDevLogSummary(v: unknown): v is DevLogSummary {
  return !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as { version?: unknown }).version === "number";
}

// GET /api/public/v1/captures/:id - full debugging context for one capture,
// sanitized for an external (AI agent) reader. Built for the bugsnap-mcp MCP
// server, but any bugsnap_... API key can call it like the list endpoint.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateApiRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Missing or invalid API key. Expected: Bearer bugsnap_..." },
        { status: 401 }
      );
    }

    if (await isRateLimited(`mcp-detail:${auth.workspaceId}`, 60, 60)) {
      return NextResponse.json({ error: "Rate limit exceeded (60 req/min)" }, { status: 429 });
    }

    const { id } = await params;
    if (!id || !isUuid(id)) {
      return NextResponse.json({ error: "Invalid capture id - expected a UUID" }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: cap, error } = await db
      .from("captures")
      .select(
        "id, title, description, type, status, tag, site_url, os, browser, window_size, duration, created_at, folder_name, drive_file_id, dev_logs, ai_summary, workspace_id"
      )
      .eq("id", id)
      .eq("workspace_id", auth.workspaceId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!cap) {
      return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    // dev_logs can be: a raw array, a compact DevLogSummary, a
    // DriveExternalLogReference (counts only - the file itself lives in
    // Drive and is not fetched here), or a "gz:" compressed string.
    let devLogs: unknown = cap.dev_logs;
    if (typeof devLogs === "string" && devLogs.startsWith("gz:")) {
      devLogs = await decompressDevLogs(devLogs);
    }

    let consoleErrors: Array<{ level: string; message: string; stack?: string }> = [];
    let networkErrors: Array<{ method: string; status: number; url: string }> = [];
    let userSteps: string[] = [];

    if (Array.isArray(devLogs)) {
      const logs = devLogs
        .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === "object")
        .map((l) => normalizeDevLog(l));

      consoleErrors = logs
        .filter((l): l is Extract<DevLog, { type: "console" }> => l.type === "console" && isConsoleError(l))
        .slice(0, CONSOLE_CAP)
        .map((l) => ({
          level: sanitizePromptData(l.level || "error", 20),
          message: sanitizePromptData(l.message || l.text || "Unknown error", 250),
          ...(l.stack ? { stack: sanitizePromptData(cleanStackTrace(l.stack), 500) } : {}),
        }));

      networkErrors = logs
        .filter((l): l is Extract<DevLog, { type: "network" }> => l.type === "network" && isNetworkFailed(l))
        .slice(0, NETWORK_CAP)
        .map((l) => ({
          method: sanitizePromptData(l.method || "GET", 10),
          status: Number(l.status) || 0,
          url: cleanUrlForTelemetry(l.url, 150),
        }));

      userSteps = logs
        .filter((l) => l.type === "step" || l.type === "navigation")
        .slice(0, STEPS_CAP)
        .map((l) => sanitizePromptData(("message" in l ? l.message : "") || ("url" in l ? l.url : "") || "", 100))
        .filter(Boolean);
    } else if (isDevLogSummary(devLogs)) {
      consoleErrors = (devLogs.topErrors ?? []).slice(0, CONSOLE_CAP).map((message) => ({
        level: "error",
        message: sanitizePromptData(message, 250),
      }));
      networkErrors = (devLogs.failedUrls ?? []).slice(0, NETWORK_CAP).map((url) => ({
        method: "GET",
        status: 0,
        url: cleanUrlForTelemetry(url, 150),
      }));
    } else if (isDriveExternalLogReference(devLogs)) {
      // Counts only - skip the extra Drive fetch for this (legacy) shape.
      consoleErrors = devLogs.errors
        ? [{ level: "error", message: `${devLogs.errors} console error(s) stored externally - open the capture in BugSnap to view them.` }]
        : [];
      networkErrors = devLogs.warnings
        ? [{ method: "GET", status: 0, url: `${devLogs.warnings} warning(s) stored externally - open the capture in BugSnap to view them.` }]
        : [];
    }

    let screenshotUrl: string | null = null;
    let videoUrl: string | null = null;
    if (cap.drive_file_id) {
      const { sig, exp } = signDownload(cap.drive_file_id);
      const mediaUrl = `${new URL(request.url).origin}/api/google-drive/download?id=${encodeURIComponent(cap.drive_file_id)}&type=${cap.type === "video" ? "video" : "screenshot"}&disposition=inline&sig=${sig}&exp=${exp}`;
      if (cap.type === "video") videoUrl = mediaUrl;
      else screenshotUrl = mediaUrl;
    }

    return NextResponse.json({
      id: cap.id,
      title: cap.title,
      description: cap.description || "",
      type: cap.type,
      status: cap.status,
      tag: cap.tag,
      site_url: cap.site_url,
      os: cap.os,
      browser: cap.browser,
      window_size: cap.window_size,
      duration: cap.duration,
      created_at: cap.created_at,
      folder_name: cap.folder_name,
      screenshot_url: screenshotUrl,
      video_url: videoUrl,
      console_errors: consoleErrors,
      network_errors: networkErrors,
      user_steps: userSteps,
      ai_summary: cap.ai_summary || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
