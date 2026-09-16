import crypto from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";

// No literal fallbacks: a committed default password is a published password,
// and a default HMAC secret lets anyone forge an admin session token.
// All four are set in Vercel (production/preview/development).
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export function getSuperAdminEmails(): string[] {
  const configured = (process.env.SUPER_ADMIN_EMAILS || "contact.akusaraproject@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!configured.includes("contact.akusaraproject@gmail.com")) {
    configured.push("contact.akusaraproject@gmail.com");
  }
  return configured;
}

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const ADMIN_COOKIE_NAME = "bugsnap_admin_session";

export interface AdminSessionPayload {
  username: string;
  exp: number; // unix timestamp in ms
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf-8");
  const bb = Buffer.from(b, "utf-8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getSuperAdminEmails().includes(normalized);
}

export function hashAdminPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, "sha512").toString("hex");
  return { hash, salt: actualSalt };
}

export async function checkAdminCredentials(user: string, pass: string): Promise<boolean> {
  if (!ADMIN_USERNAME) return false;
  if (!safeEqual(user.toLowerCase(), ADMIN_USERNAME.toLowerCase())) return false;

  // Check custom password from app_settings
  try {
    const serviceClient = createServiceClient();
    const { data } = await serviceClient
      .from("app_settings")
      .select("value")
      .eq("key", "admin_custom_credentials")
      .maybeSingle();

    if (data?.value && typeof data.value === "object") {
      const val = data.value as { hash?: string; salt?: string };
      if (val.hash && val.salt) {
        const testHash = crypto.pbkdf2Sync(pass, val.salt, 100000, 64, "sha512").toString("hex");
        return safeEqual(testHash, val.hash);
      }
    }
  } catch (err) {
    console.warn("[admin-auth] Error checking custom credentials:", err);
  }

  // Fallback to env password
  if (!ADMIN_PASSWORD) return false;
  return safeEqual(pass, ADMIN_PASSWORD);
}

export function createAdminToken(username: string): string {
  if (!SECRET) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  const payload: AdminSessionPayload = {
    username,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  };
  const jsonStr = JSON.stringify(payload);
  const b64Payload = Buffer.from(jsonStr, "utf-8").toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(b64Payload).digest("base64url");
  return `${b64Payload}.${signature}`;
}

export function verifyAdminToken(token?: string | null): AdminSessionPayload | null {
  if (!SECRET) return null;
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [b64Payload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(b64Payload).digest("base64url");
  if (!safeEqual(signature, expectedSig)) return null;

  try {
    const raw = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as AdminSessionPayload;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(req?: Request): AdminSessionPayload | null {
  // Check header first
  if (req) {
    const headerToken = req.headers.get("x-admin-token");
    const payload = verifyAdminToken(headerToken);
    if (payload) return payload;

    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]*)`));
      if (match) {
        const cookieSession = verifyAdminToken(decodeURIComponent(match[1]));
        if (cookieSession) return cookieSession;
      }
    }
  }

  // Check cookie
  try {
    const cookieStore = cookies();
    const cookieToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return verifyAdminToken(cookieToken);
  } catch {
    // cookies() might fail outside Next request context
    return null;
  }
}

export async function isRequestAdminAuthenticated(req?: Request): Promise<boolean> {
  return getAdminSessionFromRequest(req) !== null;
}

export interface AdminAuthResult {
  authorized: boolean;
  callerUserId: string | null;
  callerEmail: string | null;
  supabase: ReturnType<typeof createServiceClient>;
}

export async function checkAdminAuth(req: Request): Promise<AdminAuthResult> {
  const supabase = createServiceClient();
  const session = getAdminSessionFromRequest(req);
  let authorized = Boolean(session);
  let callerUserId: string | null = null;
  let callerEmail: string | null = null;

  if (session) {
    callerEmail = session.username ? session.username.trim() : null;
    if (callerEmail) {
      try {
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .ilike("email", callerEmail)
          .maybeSingle();
        if (userRow?.id) {
          callerUserId = userRow.id;
        }
      } catch (err) {
        console.warn("[admin-auth] Error resolving caller user by email:", err);
      }
    }
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user?.email && isSuperAdminEmail(user.email)) {
        authorized = true;
        callerUserId = user.id;
        callerEmail = user.email;
      }
    } catch (err) {
      console.warn("[admin-auth] Error validating Bearer token:", err);
    }
  }

  return { authorized, callerUserId, callerEmail, supabase };
}
