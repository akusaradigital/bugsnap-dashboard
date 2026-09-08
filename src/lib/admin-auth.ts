import crypto from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";

// No literal fallbacks: a committed default password is a published password,
// and a default HMAC secret lets anyone forge an admin session token.
// All four are set in Vercel (production/preview/development).
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
  return SUPER_ADMIN_EMAILS.includes(normalized);
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

export async function isRequestAdminAuthenticated(req?: Request): Promise<boolean> {
  // Check header first
  if (req) {
    const headerToken = req.headers.get("x-admin-token");
    if (verifyAdminToken(headerToken)) return true;
  }

  // Check cookie
  try {
    const cookieStore = cookies();
    const cookieToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (verifyAdminToken(cookieToken)) return true;
  } catch {
    // cookies() might fail outside Next request context
  }

  return false;
}
