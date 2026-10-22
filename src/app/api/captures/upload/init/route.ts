import { NextResponse } from "next/server";
import { authenticatedUser, driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Vercel serverless functions cap request bodies at 4.5MB on every plan
// (Hobby included) - not configurable. The old /api/captures/upload route
// proxied the whole file through this function, so any recording over
// ~4MB failed with an opaque 413 after the progress bar hit 100%. This
// route does all the Supabase bookkeeping and hands back a pre-authorized
// Google Drive resumable-upload session URI; the browser then PUTs the
// file bytes straight to Drive (see /api/captures/upload/finalize), so
// our function never touches the file body.
async function getOrCreateFolder(accessToken: string, folderName: string): Promise<string | null> {
  const cleanName = folderName.trim();
  if (!cleanName || cleanName === "No folder") return null;
  const escaped = cleanName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = encodeURIComponent(`name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'me' in owners`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files?: Array<{ id: string }> };
    if (data.files && data.files.length > 0) return data.files[0].id;
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: cleanName, mimeType: "application/vnd.google-apps.folder", parents: ["root"] }),
  });
  if (createRes.ok) {
    const newFolder = (await createRes.json()) as { id: string };
    return newFolder.id;
  }
  return null;
}

export async function POST(req: Request) {
  const user = await authenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as {
      title?: string;
      type?: string;
      mimeType?: string;
      size?: number;
      workspaceId?: string;
      folderName?: string;
      projectId?: string;
    } | null;
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const title = String(body.title || "Untitled").trim();
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const size = typeof body.size === "number" ? body.size : 0;
    let workspaceId = String(body.workspaceId || "").trim();
    const projectId = String(body.projectId || "").trim() || null;
    const rawFolder = String(body.folderName || "").trim();
    const folderName = rawFolder && rawFolder !== "No folder" ? rawFolder : null;

    const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB ceiling, now enforced against Drive directly, not a Vercel function body
    if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
      return NextResponse.json({ error: "Only image and video files are supported" }, { status: 415 });
    }
    if (size <= 0 || size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 413 });
    }

    const supabase = createServiceClient();

    if (!workspaceId) {
      const { data: ownerWs } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (ownerWs) {
        workspaceId = ownerWs.id;
      } else {
        const { data: memberWs } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (memberWs) workspaceId = memberWs.workspace_id;
      }
    }
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;

    let isOwner = false;
    if (!membership) {
      const { data: wsData } = await supabase
        .from("workspaces")
        .select("id, owner_user_id")
        .eq("id", workspaceId)
        .maybeSingle();
      if (wsData?.owner_user_id === user.id) isOwner = true;
    }
    if (!membership && !isOwner) return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    if (membership && membership.role === "viewer") return NextResponse.json({ error: "Viewers cannot create captures" }, { status: 403 });

    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (projectError) throw projectError;
      if (!project) return NextResponse.json({ error: "Project does not belong to this workspace" }, { status: 400 });
    }

    const accessToken = await driveAccessToken(user.id);
    const safeTitle = (title || "BugSnap Capture").replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-").slice(0, 180);
    const safeName = `${safeTitle}.${mimeType.startsWith("video/") ? "webm" : "png"}`;

    const { data: wsSet } = await supabase
      .from("workspace_settings")
      .select("integrations")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const wsIntegrations = (wsSet?.integrations && typeof wsSet.integrations === "object")
      ? (wsSet.integrations as Record<string, unknown>)
      : {};
    const configuredFolder = folderName || (typeof wsIntegrations.drive_folder_name === "string" ? wsIntegrations.drive_folder_name : "") || "BugSnap Captures";

    let parentFolderId: string | null = null;
    if (configuredFolder && configuredFolder !== "No folder") {
      parentFolderId = await getOrCreateFolder(accessToken, configuredFolder).catch(() => null);
    }

    const metadata: { name: string; mimeType: string; parents?: string[] } = { name: safeName, mimeType: mimeType || "application/octet-stream" };
    if (parentFolderId) metadata.parents = [parentFolderId];

    const initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,webViewLink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType || "application/octet-stream",
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify(metadata),
    });
    if (!initRes.ok) {
      const detail = await initRes.text().catch(() => "");
      throw new Error(`Drive upload initialization failed (${initRes.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }
    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) throw new Error("Google Drive did not return an upload session URL");

    return NextResponse.json({
      ok: true,
      uploadUrl,
      workspaceId,
      folderName: folderName || (configuredFolder && configuredFolder !== "No folder" ? configuredFolder : null),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload initialization failed" }, { status: 500 });
  }
}
