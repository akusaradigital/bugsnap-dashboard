import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verifiedGoogleEmail } from "@/lib/google-token";
import { captureFingerprint } from "@/lib/fingerprint";
import { maybeAlertAdminOfSpike } from "@/lib/spike-detector";

export const runtime = "nodejs";

const emailFromGoogleToken = verifiedGoogleEmail;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const accessToken = typeof body.access_token === "string" ? body.access_token.trim() : "";
  if (!accessToken) return NextResponse.json({ error: "access_token is required" }, { status: 400 });

  let email: string;
  try {
    email = await emailFromGoogleToken(accessToken);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized" }, { status: 401 });
  }

  const payload = body.capture;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "capture payload is required" }, { status: 400 });
  }

  const input = payload as Record<string, unknown>;
  const title = typeof input.p_title === "string" ? input.p_title.trim() : "";
  const type = input.p_type === "video" ? "video" : "screenshot";
  const driveUrl = typeof input.p_drive_url === "string" ? input.p_drive_url.trim() : "";
  if (!title || !driveUrl) return NextResponse.json({ error: "title and drive URL are required" }, { status: 400 });

  const rawLogs = input.p_dev_logs;
  const devLogsValue =
    typeof rawLogs === "string"
      ? rawLogs
      : Array.isArray(rawLogs) || (rawLogs && typeof rawLogs === "object")
        ? rawLogs
        : null;

  const siteUrl = typeof input.p_site_url === "string" ? input.p_site_url : null;

  // Grouping key for "this bug was reported N times". Derived server-side so an
  // older extension build still gets its captures grouped, and so a client
  // cannot choose which group its capture lands in. Null for a capture with no
  // error, which is normal and must stay ungrouped.
  let errorFingerprint: string | null = null;
  try {
    errorFingerprint = captureFingerprint({ devLogs: devLogsValue, siteUrl });
  } catch {
    // Grouping is an enhancement: a capture must still be stored if it fails.
    errorFingerprint = null;
  }

  const isUuid = (val: unknown): val is string =>
    typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  const validWorkspaceId = isUuid(input.p_workspace_id) ? input.p_workspace_id.trim() : null;
  const rawFolder = typeof input.p_folder_name === "string" ? input.p_folder_name.trim() : null;
  const validFolderName = rawFolder && rawFolder !== "No folder" ? rawFolder : null;

  const db = createServiceClient();
  const { data, error } = await db.rpc("insert_capture_by_email", {
    p_owner_email: email,
    p_title: title,
    p_type: type,
    p_drive_url: driveUrl,
    p_dev_logs: devLogsValue,
    p_window_size: typeof input.p_window_size === "string" && input.p_window_size.trim() ? input.p_window_size.trim() : null,
    p_description: typeof input.p_description === "string" && input.p_description.trim() ? input.p_description.trim() : null,
    p_duration: typeof input.p_duration === "number" && !Number.isNaN(input.p_duration) ? input.p_duration : null,
    p_os: typeof input.p_os === "string" && input.p_os.trim() ? input.p_os.trim() : null,
    p_browser: typeof input.p_browser === "string" && input.p_browser.trim() ? input.p_browser.trim() : null,
    p_site_url: siteUrl,
    p_folder_name: validFolderName,
    p_workspace_id: validWorkspaceId,
    p_error_fingerprint: errorFingerprint,
  });
  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });

  if (data && errorFingerprint) {
    void maybeAlertAdminOfSpike(db, errorFingerprint, siteUrl).catch(() => {});
  }

  // Non-blocking trigger for workspace team webhooks (Discord / Slack / Telegram)
  if (data) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";
    fetch(`${appUrl}/api/notifications/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capture_id: data }),
    }).catch((err) => {
      console.warn("Background webhook dispatch notification notice:", err);
    });
  }

  return NextResponse.json({ id: data });
}
