import { NextResponse } from "next/server";
import { finishConnectionByEmailCode, driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";

  // 1. SILENT BACKGROUND REFRESH (0 popups, uses refresh_token stored in Supabase DB)
  if (action === "refresh") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    if (!email) {
      return NextResponse.json({ error: "email is required for refresh" }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: conn, error: connError } = await db
      .from("google_drive_connections")
      .select("user_id, refresh_token, google_email, extension_secret_hash")
      .eq("google_email", email)
      .maybeSingle();

    if (connError || !conn || !conn.refresh_token) {
      return NextResponse.json({ error: "No Google Drive connection found for this email", code: "NOT_CONNECTED" }, { status: 404 });
    }

    // If extension_secret_hash is set, verify secret matches
    if (conn.extension_secret_hash && secret) {
      const computedHash = createHash("sha256").update(secret).digest("hex");
      if (computedHash !== conn.extension_secret_hash) {
        return NextResponse.json({ error: "Invalid session secret", code: "INVALID_SECRET" }, { status: 401 });
      }
    }

    try {
      const token = await driveAccessToken(conn.user_id);

      // Issue / update secret if it was missing or passed
      let effectiveSecret = secret;
      if (!conn.extension_secret_hash || !effectiveSecret) {
        effectiveSecret = randomBytes(32).toString("hex");
        const newHash = createHash("sha256").update(effectiveSecret).digest("hex");
        await db.from("google_drive_connections").update({ extension_secret_hash: newHash }).eq("user_id", conn.user_id);
      }

      return NextResponse.json({
        connected: true,
        email: conn.google_email,
        access_token: token,
        secret: effectiveSecret,
        expires_in: 3000
      });
    } catch (err) {
      console.error("[/api/extension/drive-connect] Silent refresh failed:", err);
      return NextResponse.json({ error: "Token refresh failed", code: "RECONNECT_REQUIRED" }, { status: 409 });
    }
  }

  // 2. INITIAL CODE EXCHANGE FLOW
  const code = typeof body.code === "string" ? body.code : "";
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
  if (!code || !redirectUri) {
    return NextResponse.json({ error: "code and redirect_uri are required" }, { status: 400 });
  }

  try {
    const { userId, email } = await finishConnectionByEmailCode(code, redirectUri);
    const token = await driveAccessToken(userId);

    const extensionSecret = randomBytes(32).toString("hex");
    const secretHash = createHash("sha256").update(extensionSecret).digest("hex");
    const db = createServiceClient();
    await db.from("google_drive_connections").update({ extension_secret_hash: secretHash }).eq("user_id", userId);

    return NextResponse.json({
      connected: true,
      email,
      access_token: token,
      secret: extensionSecret,
      expires_in: 3000
    });
  } catch (err) {
    console.error("[/api/extension/drive-connect] Failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Google Drive connection failed" }, { status: 400 });
  }
}
