import crypto from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";

// No literal fallback: a default HMAC secret would let anyone forge an admin
// session token. Set in Vercel (production/preview/development).
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
