import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAuthenticatedUser, createServiceClient } from "@/lib/supabase-server";
import { signDownload } from "@/lib/download-signing";
import { isUuid } from "@/lib/google-drive-values";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory 60s permission cache to prevent repeated database hits on media signing
const signPermCache = new Map<string, { allowed: boolean; expiresAt: number }>();

/**
 * Mints a short-lived signature for streaming one Drive file.
 *
 * Only needed for members-only captures: public ones stream without a
 * signature. The membership check happens here, once, so the stream route
 * only has to verify a signature.
 */
export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);

  const body = (await req.json().catch(() => null)) as { fileId?: unknown; password?: unknown } | null;
  const fileId = typeof body?.fileId === "string" ? body.fileId : "";
  const password = typeof body?.password === "string" ? body.password : "";
  // A password-protected public capture has no session to check - the password
  // itself is the credential, so an unauthenticated caller is allowed this far
  // and gets rejected below unless it matches.
  if (!user && !password) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const cacheKey = `${user?.id || "anon"}:${fileId}:${password}`;
  const cached = signPermCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() && cached.allowed) {
    return NextResponse.json(signDownload(fileId));
  }

  const db = createServiceClient();
  const filter = isUuid(fileId)
    ? `drive_file_id.eq.${fileId},id.eq.${fileId},drive_url.ilike.%${fileId}%,dev_logs->>driveFileId.eq.${fileId}`
    : `drive_file_id.eq.${fileId},drive_url.ilike.%${fileId}%,dev_logs->>driveFileId.eq.${fileId}`;
  const { data: cap } = await db
    .from("captures")
    .select("id, user_id, workspace_id, expires_at, password, access_mode")
    .or(filter)
    .limit(1)
    .maybeSingle();

  if (!cap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cap.expires_at && new Date(cap.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Capture expired" }, { status: 410 });
  }

  // A correct password signs a public capture on its own - that is exactly what
  // the viewer just proved to get past the lock screen. Members-only still needs
  // the membership check below regardless.
  if (cap.password && cap.access_mode !== "members") {
    const ip = clientIp(req);
    if (await isRateLimited(`sign-pass:${cap.id || fileId}:${ip}`, 10, 300)) {
      return NextResponse.json(
        { error: "Too many password attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const providedBuf = Buffer.from(password, "utf8");
    const expectedBuf = Buffer.from(cap.password, "utf8");
    const passwordsMatch =
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (passwordsMatch) {
      signPermCache.set(cacheKey, { allowed: true, expiresAt: Date.now() + 60_000 });
      return NextResponse.json(signDownload(fileId));
    }
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let allowed = cap.user_id === user.id;
  if (!allowed && cap.workspace_id) {
    const { data: ws } = await db
      .from("workspaces")
      .select("owner_user_id")
      .eq("id", cap.workspace_id)
      .maybeSingle();

    if (ws?.owner_user_id === user.id) {
      allowed = true;
    } else {
      const { data: member } = await db
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", cap.workspace_id)
        .eq("user_id", user.id)
        .maybeSingle();
      allowed = !!member;
    }
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  signPermCache.set(cacheKey, { allowed: true, expiresAt: Date.now() + 60_000 });
  return NextResponse.json(signDownload(fileId));
}
