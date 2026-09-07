import { NextResponse } from "next/server";
import { authenticatedUser, driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function makeDriveItemPublic(accessToken: string, fileId: string): Promise<void> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (/cannotShareOutsideDomain|domain/i.test(errText)) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "domain",
          }),
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Failed to set public permission on Drive item:", err);
  }
}

async function getOrCreateFolder(accessToken: string, folderName: string): Promise<string | null> {
  const cleanName = folderName.trim();
  if (!cleanName || cleanName === "No folder") return null;
  const escaped = cleanName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = encodeURIComponent(`name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'me' in owners`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files?: Array<{ id: string; webViewLink?: string }> };
    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      makeDriveItemPublic(accessToken, folderId).catch(() => {});
      return folderId;
    }
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: cleanName,
      mimeType: "application/vnd.google-apps.folder",
      parents: ["root"],
    }),
  });
  if (createRes.ok) {
    const newFolder = (await createRes.json()) as { id: string };
    await makeDriveItemPublic(accessToken, newFolder.id);
    return newFolder.id;
  }
  return null;
}

async function uploadToDrive(accessToken: string, file: File, name: string, parentFolderId?: string | null) {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: file.type || "application/octet-stream",
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }
  const boundary = "BugSnapBoundary" + Math.random().toString(16).slice(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`),
    Buffer.from(delimiter),
    Buffer.from(`Content-Type: ${metadata.mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(closeDelim),
  ]);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    if (res.status === 403 && /quota|storage/i.test(errorText)) {
      throw new Error("Google Drive storage is full. Please free up space in Google Drive or clean up old captures.");
    }
    throw new Error(`Drive upload failed (${res.status})`);
  }

  return res.json() as Promise<{ id: string; webViewLink?: string }>;
}

export async function POST(req: Request) {
  const user = await authenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const title = String(form.get("title") || "Untitled").trim();
    const type = String(form.get("type") || "screenshot");
    let workspaceId = String(form.get("workspaceId") || "").trim();
    const projectId = String(form.get("projectId") || "").trim() || null;
    const folderName = String(form.get("folderName") || "").trim() || null;
    const description = String(form.get("description") || "").trim();
    if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only image and video files are supported" }, { status: 415 });
    }

    const supabase = createServiceClient();

    // If no workspaceId specified (e.g. from general captures view), resolve user's workspace
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
        if (memberWs) {
          workspaceId = memberWs.workspace_id;
        }
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
      if (wsData?.owner_user_id === user.id) {
        isOwner = true;
      }
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
    const safeName = `${safeTitle}.${file.type.startsWith("video/") ? "webm" : "png"}`;

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

    const uploaded = await uploadToDrive(accessToken, file, safeName, parentFolderId);
    await makeDriveItemPublic(accessToken, uploaded.id);

    const { data: inserted, error } = await supabase
      .from("captures")
      .insert({
        title: title || "Untitled",
        type,
        drive_url: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
        drive_file_id: uploaded.id,
        description: description || null,
        workspace_id: workspaceId,
        project_id: projectId,
        folder_name: folderName || (configuredFolder !== "No folder" ? configuredFolder : null),
        user_id: user.id,
        owner_email: user.email,
        source: "web_upload",
      })
      .select("id, title, type, drive_url, drive_file_id, created_at, window_size, workspace_id, folder_name, project_id, source, tag, status, expires_at, password, duration, owner_email, burn_after_read")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, id: inserted?.id, capture: inserted, driveFileId: uploaded.id, driveUrl: uploaded.webViewLink });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
