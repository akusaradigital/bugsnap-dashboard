import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const input = body as { email?: unknown; workspaceId?: unknown };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId : null;
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const db = createServiceClient();
  const { data: workspaces, error: wsError } = await db.rpc("get_workspaces_by_email", { p_email: email });
  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 422 });
  const list = (workspaces ?? []) as Array<{ id: string; name: string; role: string; is_owner: boolean }>;
  const selectedWorkspaceId = workspaceId && list.some((w) => w.id === workspaceId) ? workspaceId : (list[0]?.id ?? null);

  let folders: unknown[] = [];
  let projects: unknown[] = [];
  if (selectedWorkspaceId) {
    const [{ data: folderRows, error: folderError }, { data: projectRows, error: projectError }] = await Promise.all([
      db.rpc("get_folders_by_workspace_and_email", { p_email: email, p_workspace_id: selectedWorkspaceId }),
      db.rpc("get_projects_by_workspace_and_email", { p_email: email, p_workspace_id: selectedWorkspaceId }),
    ]);
    if (folderError) return NextResponse.json({ error: folderError.message }, { status: 422 });
    if (projectError) return NextResponse.json({ error: projectError.message }, { status: 422 });
    folders = (folderRows ?? []) as unknown[];
    projects = (projectRows ?? []) as unknown[];
  }

  return NextResponse.json({
    workspaces: list,
    selectedWorkspaceId,
    folders,
    projects,
  });
}
