import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const CODE_TTL_MS = 5 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// Web (signed in) asks for a one-time code. Requires the web session Bearer token.
export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const code = randomBytes(24).toString("base64url");
  const db = createServiceClient();

  // Clean up any older unused pairing codes for this user so they don't pile up
  await db
    .from("extension_pairing_codes")
    .delete()
    .eq("user_id", user.id)
    .is("used_at", null);

  const { error } = await db.from("extension_pairing_codes").insert({
    code_hash: sha256(code),
    user_id: user.id,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: "Could not create pairing code" }, { status: 500 });
  }

  return NextResponse.json({ code, expires_in: CODE_TTL_MS / 1000 });
}

// Extension exchanges the code (single use, unexpired) for its own device secret.
export async function PUT(req: Request) {
  let body: { code?: unknown; device_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const deviceId = typeof body.device_id === "string" ? body.device_id.trim().slice(0, 128) : "";
  if (!code || !deviceId) {
    return NextResponse.json({ error: "code and device_id are required" }, { status: 400 });
  }

  const db = createServiceClient();
  const codeHash = sha256(code);

  // Atomic single-use claim: only succeeds if the code is unused and unexpired.
  const { data: claimed, error: claimErr } = await db
    .from("extension_pairing_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("user_id")
    .maybeSingle();

  if (claimErr || !claimed) {
    return NextResponse.json(
      { error: "Pairing code is invalid, expired, or already used", code: "PAIRING_INVALID" },
      { status: 401 },
    );
  }

  // Clear any existing connection for this device_id so account switching on the same browser
  // device pairs cleanly without DEVICE_TAKEN 409 collisions.
  await db
    .from("extension_device_connections")
    .delete()
    .eq("device_id", deviceId);

  // Look up user's email so the extension receives both the device secret and verified user identity
  const { data: userRow } = await db
    .from("users")
    .select("email")
    .eq("id", claimed.user_id)
    .maybeSingle();

  let userEmail = userRow?.email;
  if (!userEmail) {
    const { data: authUser } = await db.auth.admin.getUserById(claimed.user_id).catch(() => ({ data: { user: null } }));
    userEmail = authUser?.user?.email;
  }

  const deviceSecret = randomBytes(32).toString("base64url");
  const { error: pairErr } = await db.from("extension_device_connections").upsert(
    {
      user_id: claimed.user_id,
      device_id: deviceId,
      extension_secret_hash: sha256(deviceSecret),
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" },
  );
  if (pairErr) {
    return NextResponse.json({ error: "Could not pair this device" }, { status: 500 });
  }

  return NextResponse.json({
    paired: true,
    secret: deviceSecret,
    email: userEmail || undefined,
  });
}
