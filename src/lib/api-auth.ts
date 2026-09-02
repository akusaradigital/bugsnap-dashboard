import { createServiceClient } from "@/lib/supabase-server";
import { hashApiKey } from "@/lib/api-keys";

export interface AuthenticatedApiWorkspace {
  workspaceId: string;
  workspaceName?: string;
}

export async function authenticateApiRequest(request: Request): Promise<AuthenticatedApiWorkspace | null> {
  const authHeader = request.headers.get("authorization") || "";
  const rawKey = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!rawKey || !rawKey.startsWith("bugsnap_")) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);
  const db = createServiceClient();

  const { data, error } = await db
    .from("bugsnap_api_keys")
    .select("id, workspace_id, workspaces(name)")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  const now = new Date().toISOString();
  // Fire-and-forget last_used_at update
  void (async () => {
    try {
      await db.from("bugsnap_api_keys").update({ last_used_at: now }).eq("id", data.id);
    } catch {
      // ignore background error
    }
  })();

  const workspaceName = (data.workspaces as { name?: string } | null)?.name;

  return {
    workspaceId: data.workspace_id,
    workspaceName,
  };
}
