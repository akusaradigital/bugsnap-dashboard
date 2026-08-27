import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function emailFromGoogleToken(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Invalid Google token");
  const user = await res.json() as { email?: unknown };
  if (typeof user.email !== "string" || !user.email.trim()) throw new Error("Google token has no email");
  return user.email.trim().toLowerCase();
}

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

  const db = createServiceClient();
  const { data, error } = await db.rpc("insert_capture_by_email", {
    p_owner_email: email,
    p_title: title,
    p_type: type,
    p_drive_url: driveUrl,
    p_dev_logs: Array.isArray(input.p_dev_logs) || (input.p_dev_logs && typeof input.p_dev_logs === "object") ? input.p_dev_logs : null,
    p_window_size: typeof input.p_window_size === "string" ? input.p_window_size : null,
    p_description: typeof input.p_description === "string" ? input.p_description : null,
    p_duration: typeof input.p_duration === "number" ? input.p_duration : null,
    p_os: typeof input.p_os === "string" ? input.p_os : null,
    p_browser: typeof input.p_browser === "string" ? input.p_browser : null,
    p_site_url: typeof input.p_site_url === "string" ? input.p_site_url : null,
    p_folder_name: typeof input.p_folder_name === "string" ? input.p_folder_name : null,
    p_workspace_id: typeof input.p_workspace_id === "string" ? input.p_workspace_id : null,
  });
  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
  return NextResponse.json({ id: data });
}
