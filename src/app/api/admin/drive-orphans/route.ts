import { NextResponse } from "next/server";
import { driveAccessToken, listAccessibleDriveFiles, trashDriveFile } from "@/lib/google-drive";
import { parseDriveFileId } from "@/lib/google-drive-values";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

async function getAdminUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const serviceClient = createServiceClient();

  if (token) {
    const { data: { user }, error } = await serviceClient.auth.getUser(token);
    if (!error && user?.email) {
      if (isAdminAuthenticated) return user;
      const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      if (adminEmails.includes(user.email.toLowerCase())) return user;
    }
  }

  if (isAdminAuthenticated) {
    // If authenticated via admin credentials, look up user with connected drive
    const { data: conn } = await serviceClient
      .from("google_drive_connections")
      .select("user_id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conn?.user_id) {
      return { id: conn.user_id };
    }
  }

  return null;
}

async function computeOrphans(userId: string) {
  const db = createServiceClient();
  const accessToken = await driveAccessToken(userId);
  const [driveFiles, capturesResult] = await Promise.all([
    listAccessibleDriveFiles(accessToken),
    db.from("captures").select("id,title,drive_file_id,drive_url,workspaces!inner(owner_user_id)").eq("workspaces.owner_user_id", userId),
  ]);
  if (capturesResult.error) throw capturesResult.error;
  const usedIds = new Set<string>();
  for (const capture of (capturesResult.data ?? []) as Array<{ drive_file_id?: string | null; drive_url?: string | null }>) {
    const id = capture.drive_file_id ?? parseDriveFileId(capture.drive_url ?? null);
    if (id) usedIds.add(id);
  }
  const orphans = driveFiles.filter((file) => !usedIds.has(file.id));
  return { accessToken, orphans, totalDriveFiles: driveFiles.length, linkedCaptureFiles: usedIds.size };
}

export async function GET(request: Request) {
  const user = await getAdminUser(request);
  if (!user) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  try {
    const { orphans, totalDriveFiles, linkedCaptureFiles } = await computeOrphans(user.id);
    return NextResponse.json({ totalDriveFiles, linkedCaptureFiles, orphanCount: orphans.length, orphans: orphans.slice(0, 100) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to scan Drive files";
    const code = /reconnected/i.test(message) ? "DRIVE_RECONNECT_REQUIRED" : /not connected/i.test(message) ? "DRIVE_NOT_CONNECTED" : undefined;
    return NextResponse.json({ error: message, code }, { status: 422 });
  }
}

export async function POST(request: Request) {
  const user = await getAdminUser(request);
  if (!user) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const input = body as { fileIds?: unknown };
  const fileIds = Array.isArray(input.fileIds) ? input.fileIds.filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{10,200}$/.test(id)) : [];
  if (!fileIds.length) return NextResponse.json({ error: "Provide at least one Drive file id" }, { status: 400 });
  try {
    const { accessToken, orphans } = await computeOrphans(user.id);
    const allowed = new Set(orphans.map((file) => file.id));
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    let trashed = 0;
    for (const fileId of fileIds) {
      if (!allowed.has(fileId)) {
        results.push({ id: fileId, ok: false, error: "Not an orphan file" });
        continue;
      }
      try {
        await trashDriveFile(accessToken, fileId);
        trashed += 1;
        results.push({ id: fileId, ok: true });
      } catch (error) {
        results.push({ id: fileId, ok: false, error: error instanceof Error ? error.message : "Trash failed" });
      }
    }
    return NextResponse.json({ trashed, failed: fileIds.length - trashed, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to clean Drive files" }, { status: 422 });
  }
}
