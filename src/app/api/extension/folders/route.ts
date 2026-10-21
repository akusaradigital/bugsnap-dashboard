import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verifiedGoogleEmail } from "@/lib/google-token";

export const runtime = "nodejs";

const emailFromGoogleToken = verifiedGoogleEmail;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, action = "list" } = body;
    if (!access_token) return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    const email = await emailFromGoogleToken(access_token);
    const supabase = createServiceClient();

    const isUuid = (val: unknown): val is string =>
      typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

    if (action === "create") {
      const { folder_name, workspace_id } = body;
      if (!folder_name) return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
      const validWsId = isUuid(workspace_id) ? workspace_id.trim() : null;
      const { data, error } = await supabase.rpc("insert_folder_by_email", {
        p_email: email,
        p_folder_name: folder_name,
        p_workspace_id: validWsId,
      });
      if (error) throw error;
      return NextResponse.json(data?.[0] || data || {});
    }

    if (action === "rename") {
      const { workspace_id, old_name, new_name } = body;
      if (!workspace_id || !old_name || !new_name) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("rename_workspace_folder_by_email", {
        p_email: email,
        p_workspace_id: workspace_id,
        p_old_name: old_name,
        p_new_name: new_name,
      });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "delete") {
      const { workspace_id, folder_name } = body;
      if (!workspace_id || !folder_name) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("delete_workspace_folder_by_email", {
        p_email: email,
        p_workspace_id: workspace_id,
        p_folder_name: folder_name,
      });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "link") {
      const { folder_name, drive_folder_id } = body;
      if (!folder_name || !drive_folder_id) {
        return NextResponse.json({ error: "folder_name and drive_folder_id are required" }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("link_folder_drive_id", {
        p_email: email,
        p_folder_name: folder_name,
        p_drive_folder_id: drive_folder_id,
      });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Default: list folders (workspace-scoped if workspace_id provided, otherwise all)
    const rawWs = body.workspace_id || body.workspaceId;
    const targetWsId = isUuid(rawWs) ? rawWs.trim() : null;

    if (targetWsId) {
      const { data, error } = await supabase.rpc("get_folders_by_workspace_and_email", {
        p_email: email,
        p_workspace_id: targetWsId,
      });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    const { data, error } = await supabase.rpc("get_folders_by_email", { p_email: email });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Folder operation failed" }, { status: 401 });
  }
}
