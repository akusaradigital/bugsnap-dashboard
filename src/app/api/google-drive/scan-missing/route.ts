import { NextResponse } from "next/server";
import { authenticatedUser, driveAccessToken, listAccessibleDriveFiles } from "@/lib/google-drive";
import { parseDriveFileId, isUuid } from "@/lib/google-drive-values";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const db = createServiceClient();

  // If workspaceId is provided, verify user is member or owner
  if (workspaceId) {
    if (!isUuid(workspaceId)) {
      return NextResponse.json({ error: "Invalid workspaceId" }, { status: 400 });
    }
    const { data: member } = await db
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: ws } = await db
      .from("workspaces")
      .select("owner_user_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (!member && ws?.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not a workspace member" }, { status: 403 });
    }
  }

  // Token cache to query Google Drive per creator
  const tokenCache = new Map<string, string | null>();
  const tokenFor = async (ownerId: string): Promise<string | null> => {
    if (tokenCache.has(ownerId)) return tokenCache.get(ownerId) ?? null;
    const token = await driveAccessToken(ownerId).catch(() => null);
    tokenCache.set(ownerId, token);
    return token;
  };

  try {
    // 1. Fetch captures for the target workspace or personal user
    let query = db
      .from("captures")
      .select("id,title,user_id,drive_file_id,drive_url,source")
      .limit(2000);
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.eq("user_id", user.id);
    }

    const { data: capturesData, error } = await query;
    if (error) throw error;
    const captures = (capturesData ?? []) as Array<{
      id: string;
      title: string;
      user_id: string | null;
      drive_file_id: string | null;
      drive_url: string | null;
      source: string | null;
    }>;

    // 2. Identify distinct creators
    const creators = Array.from(
      new Set(captures.map((c) => c.user_id).filter((uid): uid is string => Boolean(uid)))
    );
    if (!creators.includes(user.id)) creators.push(user.id);

    // 3. For each creator whose Drive is connected, list accessible Drive files
    const creatorFilesMap = new Map<string, Set<string>>();
    for (const creatorId of creators) {
      const token = await tokenFor(creatorId);
      if (!token) continue;
      try {
        const files = await listAccessibleDriveFiles(token);
        creatorFilesMap.set(creatorId, new Set(files.map((f) => f.id)));
      } catch {
        // Token might have expired or rate-limited; skip this creator so we don't falsely flag
      }
    }

    // 4. Find captures where Drive file is definitely missing
    const missingCaptures: Array<{ id: string; title: string }> = [];
    for (const capture of captures) {
      if (capture.source === "demo") continue;
      const fileId = capture.drive_file_id ?? parseDriveFileId(capture.drive_url);
      if (!fileId) {
        if (capture.drive_url) {
          missingCaptures.push({ id: capture.id, title: capture.title });
        }
        continue;
      }

      const creatorId = capture.user_id ?? user.id;
      const creatorFiles = creatorFilesMap.get(creatorId);
      // Only flag as missing if we successfully listed this creator's Drive files AND file is not found
      if (creatorFiles && !creatorFiles.has(fileId)) {
        missingCaptures.push({ id: capture.id, title: capture.title });
      }
    }

    return NextResponse.json({
      missingIds: missingCaptures.map((c) => c.id),
      missingCaptures,
      totalMissing: missingCaptures.length,
      connected: creatorFilesMap.size > 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to scan missing Drive files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
