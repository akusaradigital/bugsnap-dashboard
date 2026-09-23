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

    if (action === "create") {
      const { folder_name, workspace_id } = body;
      if (!folder_name) return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
      const { data, error } = await supabase.rpc("insert_folder_by_email", {
        p_email: email,
        p_folder_name: folder_name,
        p_workspace_id: workspace_id || null,
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

    // Default: list folders
    const { data, error } = await supabase.rpc("get_folders_by_email", { p_email: email });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Folder operation failed" }, { status: 401 });
  }
}
