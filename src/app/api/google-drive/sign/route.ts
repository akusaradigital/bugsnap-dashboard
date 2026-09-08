import { NextResponse } from "next/server";
import { getAuthenticatedUser, createServiceClient } from "@/lib/supabase-server";
import { signDownload } from "@/lib/download-signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mints a short-lived signature for streaming one Drive file.
 *
 * Only needed for members-only captures: public ones stream without a
 * signature. The membership check happens here, once, so the stream route
 * only has to verify a signature.
 */
export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { fileId?: unknown } | null;
  const fileId = typeof body?.fileId === "string" ? body.fileId : "";
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: cap } = await db
    .from("captures")
    .select("user_id, workspace_id, expires_at")
    .or(`drive_file_id.eq.${fileId},id.eq.${fileId}`)
    .limit(1)
    .maybeSingle();

  if (!cap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cap.expires_at && new Date(cap.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Capture expired" }, { status: 410 });
  }

  let allowed = cap.user_id === user.id;
  if (!allowed && cap.workspace_id) {
    const { data: member } = await db
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", cap.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = !!member;
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(signDownload(fileId));
}
