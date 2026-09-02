import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function emailFromGoogleToken(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Invalid Google token");
  const user = await res.json() as { email?: unknown };
  if (typeof user.email !== "string" || !user.email.trim()) throw new Error("Google token has no email");
  return user.email.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const input = body as { access_token?: unknown; workspaceId?: unknown };
  const accessToken = typeof input.access_token === "string" ? input.access_token.trim() : "";
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId : null;
  if (!accessToken) return NextResponse.json({ error: "access_token is required" }, { status: 400 });

  let email: string;
  try {
    email = await emailFromGoogleToken(accessToken);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  // Auto-provision user & default workspace if they don't exist yet
  await db.rpc("ensure_user_and_workspace_by_email", { p_email: email });

  const { data: workspaces, error: wsError } = await db.rpc("get_workspaces_by_email", { p_email: email });
  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 422 });
  const list = (workspaces ?? []) as Array<{ id: string; name: string; role: string; is_owner: boolean; avatar_url: string | null }>;
  const selectedWorkspaceId = workspaceId && list.some((w) => w.id === workspaceId) ? workspaceId : (list[0]?.id ?? null);

  let folders: unknown[] = [];
  let projects: unknown[] = [];
  let integrations: Record<string, unknown> = {};
  if (selectedWorkspaceId) {
    const [{ data: folderRows, error: folderError }, { data: projectRows, error: projectError }, { data: settingsRow }] = await Promise.all([
      db.rpc("get_folders_by_workspace_and_email", { p_email: email, p_workspace_id: selectedWorkspaceId }),
      db.rpc("get_projects_by_workspace_and_email", { p_email: email, p_workspace_id: selectedWorkspaceId }),
      db.from("workspace_settings").select("integrations").eq("workspace_id", selectedWorkspaceId).maybeSingle(),
    ]);
    if (folderError) return NextResponse.json({ error: folderError.message }, { status: 422 });
    if (projectError) return NextResponse.json({ error: projectError.message }, { status: 422 });
    folders = (folderRows ?? []) as unknown[];
    projects = (projectRows ?? []) as unknown[];
    if (settingsRow?.integrations && typeof settingsRow.integrations === "object") {
      integrations = settingsRow.integrations as Record<string, unknown>;
    }
  }

  return NextResponse.json({
    workspaces: list,
    selectedWorkspaceId,
    folders,
    projects,
    integrations,
  });
}
