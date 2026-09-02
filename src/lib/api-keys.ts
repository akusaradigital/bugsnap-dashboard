import { createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase-server";

export function generateApiKey(): { rawKey: string; prefix: string } {
  const rawKey = `bugsnap_${randomBytes(32).toString("base64url")}`;
  return { rawKey, prefix: rawKey.slice(0, 15) };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(String(rawKey ?? "")).digest("hex");
}

export async function createApiKey(workspaceId: string, createdBy: string, name: string) {
  if (!workspaceId || !createdBy || !name?.trim()) {
    throw new Error("workspaceId, createdBy, and name are required");
  }

  const { rawKey, prefix } = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const db = createServiceClient();

  const { data, error } = await db
    .from("bugsnap_api_keys")
    .insert({
      workspace_id: workspaceId,
      created_by: createdBy,
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: prefix,
    })
    .select("id, name, created_at, key_prefix")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create API key");

  return {
    id: data.id,
    name: data.name,
    rawKey,
    prefix: data.key_prefix,
    createdAt: data.created_at,
  };
}

export async function listApiKeys(workspaceId: string) {
  if (!workspaceId) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("bugsnap_api_keys")
    .select("id, name, key_prefix, created_at, last_used_at")
    .eq("workspace_id", workspaceId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    createdAt: k.created_at,
    lastUsedAt: k.last_used_at,
  }));
}

export async function revokeApiKey(workspaceId: string, id: string) {
  if (!workspaceId || !id) return false;
  const db = createServiceClient();
  const { data, error } = await db
    .from("bugsnap_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}
