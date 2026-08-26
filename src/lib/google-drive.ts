import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase-server";
export { isUuid, parseDriveFileId } from "@/lib/google-drive-values";
import { isUuid } from "@/lib/google-drive-values";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
const DRIVE_LIST_FIELDS = "files(id,name,webViewLink,createdTime,trashed),nextPageToken";
const STATE_TTL_MS = 10 * 60_000;

type State = { userId: string; nonce: string; exp: number };
type Connection = { user_id: string; refresh_token: string; google_email: string | null; updated_at?: string | null };
export type DriveConnectionStatus = "connected" | "reconnect_required" | "not_connected";
export type DriveQuota = { usedBytes: number | null; totalBytes: number | null };
export type DriveConnectionHealth = { status: DriveConnectionStatus; email: string | null; updatedAt: string | null; message: string; quota?: DriveQuota | null };

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function key() {
  return createHash("sha256").update(env("GOOGLE_DRIVE_ENCRYPTION_KEY"), "utf8").digest();
}

export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function decrypt(value: string) {
  const data = Buffer.from(value, "base64url");
  if (data.length < 29) throw new Error("Invalid encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
}

export async function authenticatedUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const { data: { user }, error } = await createServiceClient().auth.getUser(token);
  return error ? null : user;
}

export async function createConnectUrl(userId: string) {
  const db = createServiceClient();
  const nonce = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();
  const { error } = await db.from("google_drive_oauth_states").insert({ nonce_hash: createHash("sha256").update(nonce).digest("hex"), user_id: userId, expires_at: expiresAt });
  if (error) throw error;
  const state = encrypt(JSON.stringify({ userId, nonce, exp: Date.now() + STATE_TTL_MS } satisfies State));
  const params = new URLSearchParams({ client_id: env("GOOGLE_DRIVE_CLIENT_ID"), redirect_uri: env("GOOGLE_DRIVE_REDIRECT_URI"), response_type: "code", scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email", access_type: "offline", prompt: "consent", state });
  return `${GOOGLE_AUTH}?${params}`;
}

export async function consumeState(value: string) {
  const state = JSON.parse(decrypt(value)) as State;
  if (!isUuid(state.userId) || typeof state.nonce !== "string" || !state.nonce || typeof state.exp !== "number" || state.exp < Date.now()) throw new Error("OAuth state expired");
  const db = createServiceClient();
  const nonceHash = createHash("sha256").update(state.nonce).digest("hex");
  const { data, error } = await db.from("google_drive_oauth_states").delete().eq("nonce_hash", nonceHash).eq("user_id", state.userId).gt("expires_at", new Date().toISOString()).select("user_id").maybeSingle();
  if (error || !data) throw new Error("OAuth state is invalid or already used");
  return state.userId;
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch(GOOGLE_TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env("GOOGLE_DRIVE_CLIENT_ID"), client_secret: env("GOOGLE_DRIVE_CLIENT_SECRET"), ...params }), cache: "no-store" });
  const body = await response.json();
  if (!response.ok || typeof body.access_token !== "string") throw new Error("Google token exchange failed");
  return body as { access_token: string; refresh_token?: string; expires_in?: number };
}

export async function finishConnection(userId: string, code: string) {
  const tokens = await tokenRequest({ code, redirect_uri: env("GOOGLE_DRIVE_REDIRECT_URI"), grant_type: "authorization_code" });
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token");
  const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" });
  const profile = info.ok ? await info.json() as { email?: string } : {};
  const { error } = await createServiceClient().from("google_drive_connections").upsert({ user_id: userId, refresh_token: encrypt(tokens.refresh_token), google_email: profile.email ?? null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

async function getDriveConnection(userId: string) {
  const { data, error } = await createServiceClient().from("google_drive_connections").select("user_id,refresh_token,google_email,updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data as Connection | null) ?? null;
}

export async function getDriveConnectionHealth(userId: string): Promise<DriveConnectionHealth> {
  const connection = await getDriveConnection(userId);
  if (!connection) {
    return { status: "not_connected", email: null, updatedAt: null, message: "Google Drive is not connected", quota: null };
  }
  try {
    const accessToken = await tokenRequest({ refresh_token: decrypt(connection.refresh_token), grant_type: "refresh_token" });
    const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota", {
      headers: { Authorization: `Bearer ${accessToken.access_token}` },
      cache: "no-store",
    });
    const about = await aboutRes.json().catch(() => ({})) as { storageQuota?: { limit?: string; usage?: string } };
    const quota = aboutRes.ok
      ? {
          usedBytes: about.storageQuota?.usage ? Number(about.storageQuota.usage) : null,
          totalBytes: about.storageQuota?.limit ? Number(about.storageQuota.limit) : null,
        }
      : null;
    return {
      status: "connected",
      email: connection.google_email ?? null,
      updatedAt: connection.updated_at ?? null,
      message: "Google Drive is connected",
      quota,
    };
  } catch {
    return {
      status: "reconnect_required",
      email: connection.google_email ?? null,
      updatedAt: connection.updated_at ?? null,
      message: "Google Drive needs to be reconnected",
      quota: null,
    };
  }
}

// In-memory access token cache with 50-minute TTL to reduce Google OAuth roundtrips
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function driveAccessToken(userId: string) {
  const cached = tokenCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const connection = await getDriveConnection(userId);
  if (!connection) throw new Error("Google Drive is not connected");
  try {
    const tokens = await tokenRequest({ refresh_token: decrypt(connection.refresh_token), grant_type: "refresh_token" });
    const ttlMs = (tokens.expires_in ? Math.max(tokens.expires_in - 300, 300) : 3000) * 1000;
    tokenCache.set(userId, { token: tokens.access_token, expiresAt: Date.now() + ttlMs });
    return tokens.access_token;
  } catch {
    tokenCache.delete(userId);
    throw new Error("Google Drive needs to be reconnected");
  }
}

async function setDriveFileTrashed(accessToken: string, fileId: string, trashed: boolean) {
  const response = await fetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}?supportsAllDrives=true`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ trashed }), cache: "no-store" });
  if (response.ok || (trashed && response.status === 404)) return;
  throw new Error(`Google Drive rejected ${trashed ? "trash" : "restore"} request (${response.status})`);
}

export function trashDriveFile(accessToken: string, fileId: string) {
  return setDriveFileTrashed(accessToken, fileId, true);
}

export function untrashDriveFile(accessToken: string, fileId: string) {
  return setDriveFileTrashed(accessToken, fileId, false);
}

export async function listAccessibleDriveFiles(accessToken: string) {
  const files: Array<{ id: string; name: string; webViewLink: string | null; createdTime: string | null; trashed: boolean | null }> = [];
  let pageToken: string | null = null;
  for (;;) {
    const params = new URLSearchParams({
      pageSize: "100",
      fields: DRIVE_LIST_FIELDS,
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      q: "trashed=false",
      ...(pageToken ? { pageToken } : {}),
    });
    const response = await fetch(`${DRIVE_FILES}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({})) as { files?: Array<{ id?: string; name?: string; webViewLink?: string | null; createdTime?: string | null; trashed?: boolean | null }>; nextPageToken?: string };
    if (!response.ok) throw new Error(`Google Drive list request failed (${response.status})`);
    for (const file of body.files ?? []) {
      if (!file.id) continue;
      files.push({
        id: file.id,
        name: file.name || "Untitled",
        webViewLink: file.webViewLink ?? null,
        createdTime: file.createdTime ?? null,
        trashed: file.trashed ?? null,
      });
    }
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }
  return files;
}
