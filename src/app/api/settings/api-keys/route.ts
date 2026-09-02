import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { authenticatedUser } from "@/lib/google-drive";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";

async function requireOwner(request: Request, workspaceId: string) {
  const user = await authenticatedUser(request);
  if (!user) return null;

  const db = createServiceClient();
  const { data } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || data.role !== "owner") {
    return null;
  }

  return user;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const user = await requireOwner(request, workspaceId);
  if (!user) {
    return NextResponse.json({ error: "Forbidden: Only workspace owners can manage API keys" }, { status: 403 });
  }

  try {
    const keys = await listApiKeys(workspaceId);
    return NextResponse.json({ keys });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list API keys";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as { workspaceId?: unknown; name?: unknown };
  const workspaceId = typeof input?.workspaceId === "string" ? input.workspaceId : "";
  const name = typeof input?.name === "string" ? input.name : "Default API Key";

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const user = await requireOwner(request, workspaceId);
  if (!user) {
    return NextResponse.json({ error: "Forbidden: Only workspace owners can manage API keys" }, { status: 403 });
  }

  try {
    const key = await createApiKey(workspaceId, user.id, name);
    return NextResponse.json({ key }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create API key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const id = url.searchParams.get("id");

  if (!workspaceId || !id) {
    return NextResponse.json({ error: "workspaceId and id are required" }, { status: 400 });
  }

  const user = await requireOwner(request, workspaceId);
  if (!user) {
    return NextResponse.json({ error: "Forbidden: Only workspace owners can manage API keys" }, { status: 403 });
  }

  try {
    const ok = await revokeApiKey(workspaceId, id);
    if (!ok) return NextResponse.json({ error: "Key not found or already revoked" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to revoke API key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
