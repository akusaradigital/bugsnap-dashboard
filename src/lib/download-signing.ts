import "server-only";

import crypto from "crypto";

/**
 * Short-lived signatures for /api/google-drive/download.
 *
 * `<img>` and `<video>` cannot send an Authorization header, so a members-only
 * capture cannot be gated by the Bearer token the rest of the app uses. The
 * page asks the server to sign the file id once (server checks membership),
 * and the media tag carries that signature instead of a credential.
 *
 * The signature only proves "someone with access asked for this file id
 * recently" — it is not a session, and it expires on its own.
 */

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const DOWNLOAD_SIG_TTL_S = 60 * 60; // matches the 1h Cache-Control on the stream

function hmac(fileId: string, exp: number): string {
  return crypto.createHmac("sha256", SECRET).update(`${fileId}|${exp}`).digest("base64url");
}

export function signDownload(fileId: string): { sig: string; exp: number } {
  if (!SECRET) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  const exp = Math.floor(Date.now() / 1000) + DOWNLOAD_SIG_TTL_S;
  return { sig: hmac(fileId, exp), exp };
}

export function verifyDownloadSig(fileId: string, sig?: string | null, exp?: string | null): boolean {
  if (!SECRET || !sig || !exp) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now() / 1000) return false;

  const expected = Buffer.from(hmac(fileId, expNum), "utf-8");
  const given = Buffer.from(sig, "utf-8");
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
