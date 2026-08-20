import { NextResponse } from "next/server";
import { authenticatedUser, driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function uploadToDrive(accessToken: string, file: File, name: string) {
  const metadata = {
    name,
    mimeType: file.type || "application/octet-stream",
  };
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
    const workspaceId = String(form.get("workspaceId") || "").trim();
    const projectId = String(form.get("projectId") || "").trim() || null;
    const description = String(form.get("description") || "").trim();
    if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

    const accessToken = await driveAccessToken(user.id);
    const safeName = `${title || "BugSnap Capture"}.${file.type.startsWith("video/") ? "webm" : "png"}`;
    const uploaded = await uploadToDrive(accessToken, file, safeName);

    const supabase = createServiceClient();
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
        user_id: user.id,
        owner_email: user.email,
        source: "web_upload",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, id: inserted?.id, driveFileId: uploaded.id, driveUrl: uploaded.webViewLink });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
