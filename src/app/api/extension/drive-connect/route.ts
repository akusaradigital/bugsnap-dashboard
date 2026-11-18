import { NextResponse } from "next/server";
import {
  finishConnectionByEmailCode,
  driveAccessToken,
  DriveGrantRevokedError,
} from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

function secretMatches(provided: string, expectedHash: string): boolean {
  if (!provided || !expectedHash) return false;
  const hash = createHash("sha256").update(provided).digest("hex");
  const a = Buffer.from(hash, "utf-8");
  const b = Buffer.from(expectedHash, "utf-8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type Db = ReturnType<typeof createServiceClient>;

// The email the extension sends is the BugSnap login. It can also be the Drive account of a different
// user, so the device secret decides which of the two accounts this device really belongs to.
async function resolveDeviceOwner(db: Db, email: string, deviceId: string, secret: string) {
  const [account, drive] = await Promise.all([
    db.from("users").select("id").eq("email", email).maybeSingle(),
    db.from("google_drive_connections").select("user_id").eq("google_email", email).maybeSingle(),
  ]);
  const candidates = Array.from(new Set([account.data?.id, drive.data?.user_id].filter((id): id is string => Boolean(id))));
  let paired = false;
  for (const userId of candidates) {
    const { data: device } = await db
      .from("extension_device_connections")
      .select("extension_secret_hash")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .maybeSingle();
    if (!device) continue;
    paired = true;
    if (secretMatches(secret, device.extension_secret_hash)) return { userId, candidates, paired };
  }
  return { userId: null, candidates, paired };
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  // Each extension install sends its own stable, locally-generated device_id
  // so its secret is paired per-device (extension_device_connections), not
  // per-user. Without this, connecting Google Drive on a second laptop would
  // overwrite the first laptop's only secret and kick it out, surfacing as a
  // false "session expired" error even though the Drive grant itself was fine.
  const deviceId = typeof body.device_id === "string" ? body.device_id.trim().slice(0, 128) : "";

  // 0. DISCONNECT / REVOKE FLOW
  // Invalidates this device's paired secret only - other devices paired to
  // the same account are untouched.
  if (action === "disconnect") {
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    if (email && secret && deviceId) {
      try {
        const db = createServiceClient();
        const { userId } = await resolveDeviceOwner(db, email, deviceId, secret);
        if (userId) {
          await db
            .from("extension_device_connections")
            .delete()
            .eq("user_id", userId)
            .eq("device_id", deviceId);
        }
      } catch (err) {
        console.warn("[/api/extension/drive-connect] Disconnect revocation error:", err);
      }
    }
    return NextResponse.json({ ok: true, disconnected: true });
  }

  // 1. SILENT BACKGROUND REFRESH (0 popups, uses refresh_token stored in Supabase DB)
  if (action === "refresh") {
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    if (!email) {
      return NextResponse.json(
        { error: "email is required for refresh" },
        { status: 400 },
      );
    }
    if (!deviceId) {
      return NextResponse.json(
        { error: "device_id is required for refresh" },
        { status: 400 },
      );
    }

    const db = createServiceClient();
    // The device secret is the ONLY credential on this branch - an email alone
    // is public knowledge. Without this check anyone could POST an email and
    // receive a live Google Drive access token for that account.
    const owner = await resolveDeviceOwner(db, email, deviceId, secret);
    const { data: connections, error: connError } = owner.candidates.length
      ? await db
          .from("google_drive_connections")
          .select("user_id, refresh_token")
          .in("user_id", owner.userId ? [owner.userId] : owner.candidates)
      : { data: [], error: null };
    const usable = (connections ?? []).filter((c) => c.refresh_token);

    if (connError || usable.length === 0) {
      return NextResponse.json(
        {
          error: "No Google Drive connection found for this email",
          code: "NOT_CONNECTED",
        },
        { status: 404 },
      );
    }
    if (!owner.userId) {
      // Unpaired device: the extension must re-run the code exchange, the only
      // flow that proves possession of the Google account.
      return owner.paired
        ? NextResponse.json({ error: "Invalid extension secret", code: "RECONNECT_REQUIRED" }, { status: 401 })
        : NextResponse.json({ error: "Extension is not paired with this connection", code: "RECONNECT_REQUIRED" }, { status: 409 });
    }
    const conn = { user_id: owner.userId };

    try {
      const token = await driveAccessToken(conn.user_id);

      await db
        .from("extension_device_connections")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", conn.user_id)
        .eq("device_id", deviceId);

      return NextResponse.json({
        connected: true,
        // Echo the BugSnap login email: the extension keys its session on it, not on the Drive account.
        email,
        access_token: token,
        secret,
        expires_in: 3000,
      });
    } catch (err) {
      console.error(
        "[/api/extension/drive-connect] Silent refresh failed:",
        err,
      );
      const isScopeError =
        err instanceof Error &&
        /DRIVE_PERMISSION_DENIED|drive\.file|insufficient/i.test(err.message);
      if (isScopeError) {
        return NextResponse.json(
          {
            error: "Google Drive permission was not granted. Please reconnect and check the Drive permission box.",
            code: "DRIVE_PERMISSION_DENIED",
          },
          { status: 403 },
        );
      }
      // Only a genuinely revoked grant should ever tell the extension to stop
      // retrying and prompt the user to reconnect. A transient failure (network
      // blip, Google outage) gets a 503 instead of 409, so fetchWithTokenRefresh
      // on the extension side treats it like any other retryable server error.
      if (err instanceof DriveGrantRevokedError) {
        return NextResponse.json(
          { error: "Google Drive access was revoked. Please reconnect.", code: "RECONNECT_REQUIRED" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Token refresh failed temporarily", code: "TRANSIENT_REFRESH_FAILURE" },
        { status: 503 },
      );
    }
  }

  // 2. INITIAL CODE EXCHANGE FLOW
  const code = typeof body.code === "string" ? body.code : "";
  const redirectUri =
    typeof body.redirect_uri === "string" ? body.redirect_uri : "";
  if (!code || !redirectUri) {
    return NextResponse.json(
      { error: "code and redirect_uri are required" },
      { status: 400 },
    );
  }

  if (!deviceId) {
    return NextResponse.json(
      { error: "device_id is required" },
      { status: 400 },
    );
  }

  try {
    const { userId, email } = await finishConnectionByEmailCode(
      code,
      redirectUri,
    );
    const token = await driveAccessToken(userId);

    const extensionSecret = randomBytes(32).toString("hex");
    const secretHash = createHash("sha256")
      .update(extensionSecret)
      .digest("hex");
    const db = createServiceClient();
    // upsert, not insert: reconnecting the same device (e.g. after a manual
    // disconnect) must replace that device's own secret, not create a
    // duplicate row or collide on the (user_id, device_id) primary key.
    await db
      .from("extension_device_connections")
      .upsert(
        { user_id: userId, device_id: deviceId, extension_secret_hash: secretHash, last_used_at: new Date().toISOString() },
        { onConflict: "user_id,device_id" },
      );

    return NextResponse.json({
      connected: true,
      email,
      access_token: token,
      secret: extensionSecret,
      expires_in: 3000,
    });
  } catch (err) {
    console.error("[/api/extension/drive-connect] Failed:", err);
    const msg =
      err instanceof Error ? err.message : "Google Drive connection failed";
    const isScopeError =
      /DRIVE_PERMISSION_DENIED|drive\.file|insufficient/i.test(msg);
    return NextResponse.json(
      {
        error: msg,
        code: isScopeError ? "DRIVE_PERMISSION_DENIED" : "CONNECT_FAILED",
      },
      { status: isScopeError ? 403 : 400 },
    );
  }
}
