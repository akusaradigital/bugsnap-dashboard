import { NextResponse } from "next/server";
import { finishConnectionByEmailCode, driveAccessToken } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
  if (!code || !redirectUri) {
    return NextResponse.json({ error: "code and redirect_uri are required" }, { status: 400 });
  }

  try {
    const { userId, email } = await finishConnectionByEmailCode(code, redirectUri);
    const token = await driveAccessToken(userId);
    return NextResponse.json({ connected: true, email, access_token: token, expires_in: 3000 });
  } catch (err) {
    console.error("[/api/extension/drive-connect] Failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Google Drive connection failed" }, { status: 400 });
  }
}
