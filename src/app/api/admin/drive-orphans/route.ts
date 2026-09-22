import { NextResponse } from "next/server";
import { driveAccessToken, listAccessibleDriveFiles, trashDriveFile } from "@/lib/google-drive";
import { parseDriveFileId, isUuid } from "@/lib/google-drive-values";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-audit";
import { sanitizeErrorMessage } from "@/lib/redact";

export const runtime = "nodejs";

interface AdminCaller {
  callerEmail: string;
  callerUserId?: string;
}

async function getAdminCaller(req: Request): Promise<AdminCaller | null> {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const serviceClient = createServiceClient();

  if (token) {
    const { data: { user }, error } = await serviceClient.auth.getUser(token);
    if (!error && user?.email) {
      if (isAdminAuthenticated) {
        return { callerEmail: user.email, callerUserId: user.id };
      }
      const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (adminEmails.includes(user.email.toLowerCase())) {
        return { callerEmail: user.email, callerUserId: user.id };
      }
    }
  }

  if (isAdminAuthenticated) {
    return { callerEmail: "admin-session" };
  }

  return null;
}

function resolveTargetUserId(
  explicitUserId: string | null | undefined,
  callerUserId?: string
): { userId: string } | { error: string; status: number; code: string } {
  const targetId = explicitUserId?.trim() || callerUserId;

  if (!targetId) {
    return {
      error: "Target userId is required. Specify ?userId=<uuid> or log in with an admin user account.",
      status: 400,
      code: "TARGET_USER_REQUIRED",
    };
  }

  if (!isUuid(targetId)) {
    return {
      error: "Invalid target userId format: must be a valid UUID.",
      status: 400,
      code: "INVALID_USER_ID",
    };
  }

  return { userId: targetId };
}

async function computeOrphans(userId: string) {
  const db = createServiceClient();
  const accessToken = await driveAccessToken(userId);
  const [driveFiles, usedIds] = await Promise.all([
    listAccessibleDriveFiles(accessToken),
    (async () => {
      const ids = new Set<string>();
      let from = 0;
      const pageSize = 1000;
      for (;;) {
        const { data, error } = await db
          .from("captures")
          .select("drive_file_id,drive_url")
          .eq("user_id", userId)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const capture of data as Array<{ drive_file_id?: string | null; drive_url?: string | null }>) {
          const id = capture.drive_file_id ?? parseDriveFileId(capture.drive_url ?? null);
          if (id) ids.add(id);
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return ids;
    })(),
  ]);
  const orphans = driveFiles.filter((file) => !usedIds.has(file.id));
  return { accessToken, orphans, totalDriveFiles: driveFiles.length, linkedCaptureFiles: usedIds.size };
}

export async function GET(request: Request) {
  const admin = await getAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const target = resolveTargetUserId(searchParams.get("userId"), admin.callerUserId);
  if ("error" in target) {
    return NextResponse.json({ error: target.error, code: target.code }, { status: target.status });
  }

  try {
    const { orphans, totalDriveFiles, linkedCaptureFiles } = await computeOrphans(target.userId);
    return NextResponse.json({
      targetUserId: target.userId,
      totalDriveFiles,
      linkedCaptureFiles,
      orphanCount: orphans.length,
      orphans: orphans.slice(0, 100),
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unable to scan Drive files";
    const code = /reconnected/i.test(rawMessage)
      ? "DRIVE_RECONNECT_REQUIRED"
      : /not connected/i.test(rawMessage)
      ? "DRIVE_NOT_CONNECTED"
      : undefined;
    const message = sanitizeErrorMessage(rawMessage, "Unable to scan Drive files");
    return NextResponse.json({ error: message, code }, { status: 422 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = (body && typeof body === "object" ? body : {}) as {
    fileIds?: unknown;
    userId?: unknown;
  };

  const { searchParams } = new URL(request.url);
  const paramUserId = searchParams.get("userId")?.trim();
  const bodyUserId = typeof input.userId === "string" ? input.userId.trim() : undefined;

  if (bodyUserId && paramUserId && bodyUserId !== paramUserId) {
    return NextResponse.json(
      { error: "Conflicting userId in request body and query parameter", code: "USER_ID_MISMATCH" },
      { status: 400 }
    );
  }

  const target = resolveTargetUserId(bodyUserId || paramUserId, admin.callerUserId);
  if ("error" in target) {
    return NextResponse.json({ error: target.error, code: target.code }, { status: target.status });
  }

  const fileIds = Array.isArray(input.fileIds)
    ? input.fileIds.filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{10,200}$/.test(id))
    : [];
  if (!fileIds.length) {
    return NextResponse.json({ error: "Provide at least one Drive file id" }, { status: 400 });
  }

  try {
    const { accessToken, orphans } = await computeOrphans(target.userId);
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
        results.push({ id: fileId, ok: false, error: sanitizeErrorMessage(error, "Trash failed") });
      }
    }

    // Strictly audit every deletion / clean attempt
    const trashedIds = results.filter((r) => r.ok).map((r) => r.id);
    await logSecurityEvent({
      type: "admin_action",
      title: trashed > 0 ? "Google Drive Orphan Files Trashed" : "Google Drive Orphan Trash Attempt Failed",
      detail: `Admin ${admin.callerEmail} trashed ${trashed}/${fileIds.length} orphan Drive file(s) for user ${target.userId}.${
        trashedIds.length > 0 ? ` File IDs: ${trashedIds.join(", ")}` : ""
      }`,
    });

    return NextResponse.json({
      targetUserId: target.userId,
      trashed,
      failed: fileIds.length - trashed,
      results,
    });
  } catch (error) {
    const message = sanitizeErrorMessage(error, "Unable to clean Drive files");
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
