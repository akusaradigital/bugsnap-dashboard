import { NextResponse } from "next/server";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function verifyWorkspaceOwner(db: ReturnType<typeof createServiceClient>, workspaceId: string, userId: string): Promise<boolean> {
  const { data: ws } = await db
    .from("workspaces")
    .select("owner_user_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (ws && ws.owner_user_id === userId) {
    return true;
  }

  const { data: member } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  return member?.role === "owner";
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    workspaceId?: unknown;
    userId?: unknown;
    role?: unknown;
  } | null;

  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";
  const targetUserId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const role = typeof body?.role === "string" ? body.role.trim().toLowerCase() : "";

  if (!workspaceId || !targetUserId || !role) {
    return NextResponse.json({ error: "Missing required fields: workspaceId, userId, role" }, { status: 400 });
  }

  if (role !== "creator" && role !== "viewer") {
    return NextResponse.json({ error: "Role must be either 'creator' or 'viewer'" }, { status: 400 });
  }

  const db = createServiceClient();
  const isOwner = await verifyWorkspaceOwner(db, workspaceId, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden: Only workspace owners can modify member roles" }, { status: 403 });
  }

  // Ensure target is not the workspace owner
  const { data: targetMember } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 });
  }

  if (targetMember.role === "owner") {
    return NextResponse.json({ error: "Cannot change the workspace owner's role" }, { status: 400 });
  }

  const { error: updateError } = await db
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    member: { user_id: targetUserId, role },
  });
}

export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  let workspaceId = url.searchParams.get("workspaceId") || "";
  let targetUserId = url.searchParams.get("userId") || "";

  if (!workspaceId || !targetUserId) {
    const body = (await req.json().catch(() => null)) as {
      workspaceId?: unknown;
      userId?: unknown;
    } | null;
    if (typeof body?.workspaceId === "string") workspaceId = body.workspaceId.trim();
    if (typeof body?.userId === "string") targetUserId = body.userId.trim();
  }

  if (!workspaceId || !targetUserId) {
    return NextResponse.json({ error: "Missing required parameters: workspaceId, userId" }, { status: 400 });
  }

  const db = createServiceClient();
  const isOwner = await verifyWorkspaceOwner(db, workspaceId, user.id);
  const isSelfLeaving = user.id === targetUserId;

  if (!isOwner && !isSelfLeaving) {
    return NextResponse.json({ error: "Forbidden: Only workspace owners can remove members" }, { status: 403 });
  }

  // Prevent owner removal (owner cannot be removed or leave without transferring ownership)
  const { data: targetMember } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 });
  }

  if (targetMember.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
  }

  const { error: deleteError } = await db
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    removedUserId: targetUserId,
  });
}
