import { NextResponse } from "next/server";
import { authenticatedUser, driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Second half of the direct-to-Drive upload (see /api/captures/upload/init):
// the browser has already PUT the file bytes straight to the Drive session
// URL that init returned, so this only sets Drive sharing on the resulting
// file and writes the captures row - no file body ever passes through here.
async function makeDriveItemPublic(accessToken: string, fileId: string): Promise<void> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (/cannotShareOutsideDomain|domain/i.test(errText)) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ role: "reader", type: "domain" }),
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Failed to set public permission on Drive item:", err);
  }
}

export async function POST(req: Request) {
  const user = await authenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as {
      fileId?: string;
      webViewLink?: string;
      title?: string;
      type?: string;
      workspaceId?: string;
      folderName?: string;
      projectId?: string;
      description?: string;
    } | null;
    const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
    const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";
    if (!fileId || !workspaceId) return NextResponse.json({ error: "Missing fileId or workspaceId" }, { status: 400 });

    const supabase = createServiceClient();

    // Re-check membership: init already verified it, but finalize is a
    // separate authenticated call and must not trust the client's claim.
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    let isOwner = false;
    if (!membership) {
      const { data: wsData } = await supabase.from("workspaces").select("owner_user_id").eq("id", workspaceId).maybeSingle();
      isOwner = wsData?.owner_user_id === user.id;
    }
    if (!membership && !isOwner) return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    if (membership && membership.role === "viewer") return NextResponse.json({ error: "Viewers cannot create captures" }, { status: 403 });

    const accessToken = await driveAccessToken(user.id);
    await makeDriveItemPublic(accessToken, fileId);

    const title = String(body?.title || "Untitled").trim();
    const type = body?.type === "video" ? "video" : "screenshot";
    const projectId = typeof body?.projectId === "string" && body.projectId.trim() ? body.projectId.trim() : null;
    const folderName = typeof body?.folderName === "string" && body.folderName.trim() ? body.folderName.trim() : null;
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const webViewLink = typeof body?.webViewLink === "string" && body.webViewLink ? body.webViewLink : `https://drive.google.com/file/d/${fileId}/view`;

    const { data: inserted, error } = await supabase
      .from("captures")
      .insert({
        title: title || "Untitled",
        type,
        drive_url: webViewLink,
        drive_file_id: fileId,
        description: description || null,
        workspace_id: workspaceId,
        project_id: projectId,
        folder_name: folderName,
        user_id: user.id,
        owner_email: user.email,
        source: "web_upload",
      })
      .select("id, title, type, drive_url, drive_file_id, created_at, window_size, workspace_id, folder_name, project_id, source, tag, status, expires_at, password, duration, owner_email, burn_after_read")
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, id: inserted?.id, capture: inserted, driveFileId: fileId, driveUrl: webViewLink });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload finalize failed" }, { status: 500 });
  }
}
