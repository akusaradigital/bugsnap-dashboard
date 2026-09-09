import { NextResponse } from "next/server";
import { finishConnectionByEmailCode, driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

function secretMatches(provided: string, expectedHash: string): boolean {
  if (!provided || !expectedHash) return false;
  const hash = createHash("sha256").update(provided).digest("hex");
  const a = Buffer.from(hash, "utf-8");
  const b = Buffer.from(expectedHash, "utf-8");
  return a.length === b.length && timingSafeEqual(a, b);
}

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

    // The device secret is the ONLY credential on this branch — an email alone
    // is public knowledge. Without this check anyone could POST an email and
    // receive a live Google Drive access token for that account.
    if (!conn.extension_secret_hash) {
      // Never had a secret issued: the extension must re-run the code exchange,
      // which is the only flow that proves possession of the Google account.
      return NextResponse.json(
        { error: "Extension is not paired with this connection", code: "RECONNECT_REQUIRED" },
        { status: 409 }
      );
    }
    if (!secretMatches(secret, conn.extension_secret_hash)) {
      return NextResponse.json(
        { error: "Invalid extension secret", code: "RECONNECT_REQUIRED" },
        { status: 401 }
      );
    }

    try {
      const token = await driveAccessToken(conn.user_id);

      return NextResponse.json({
        connected: true,
        email: conn.google_email,
        access_token: token,
        secret,
        expires_in: 3000
      });
    } catch (err) {
      console.error("[/api/extension/drive-connect] Silent refresh failed:", err);
      const isScopeError = err instanceof Error && /DRIVE_PERMISSION_DENIED|drive\.file|insufficient/i.test(err.message);
      return NextResponse.json({
        error: isScopeError
          ? "Google Drive permission was not granted. Please reconnect and check the Drive permission box."
          : "Token refresh failed",
        code: isScopeError ? "DRIVE_PERMISSION_DENIED" : "RECONNECT_REQUIRED"
      }, { status: isScopeError ? 403 : 409 });
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
    const msg = err instanceof Error ? err.message : "Google Drive connection failed";
    const isScopeError = /DRIVE_PERMISSION_DENIED|drive\.file|insufficient/i.test(msg);
    return NextResponse.json({
      error: msg,
      code: isScopeError ? "DRIVE_PERMISSION_DENIED" : "CONNECT_FAILED"
    }, { status: isScopeError ? 403 : 400 });
  }
}
