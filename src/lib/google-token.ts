import "server-only";

interface CachedTokenEntry {
  email: string;
  expiresAt: number;
}

// In-memory cache for verified Google tokens to eliminate 200-400ms external
// round-trip latency on repeated extension requests during active capture/browse sessions.
const tokenCache = new Map<string, CachedTokenEntry>();
const MAX_CACHE_ENTRIES = 1000;

/**
 * Verify a Google OAuth access token AND that it was minted for our own OAuth
 * client. `/oauth2/v3/userinfo` alone is not an authentication check: it accepts
 * a bearer token issued to ANY Google client, so without the audience check an
 * attacker could mint a token via their own OAuth app (with only the `email`
 * scope) and replay it here to act as the victim.
 *
 * `/oauth2/v3/tokeninfo` is the only endpoint that returns `aud`.
 */
export async function verifiedGoogleEmail(accessToken: string): Promise<string> {
  const expectedAud = (process.env.GOOGLE_DRIVE_CLIENT_ID || "")
    .replace(/^[\uFEFF\u200B-\u200D\uFFFD]+|[\uFEFF\u200B-\u200D\uFFFD]+$/g, "")
    .trim();
  if (!expectedAud) throw new Error("GOOGLE_DRIVE_CLIENT_ID is not configured");

  if (typeof accessToken !== "string" || !accessToken.trim()) {
    throw new Error("Invalid Google token");
  }

  const cleanToken = accessToken.trim();
  const now = Date.now();
  const cached = tokenCache.get(cleanToken);
  if (cached && cached.expiresAt > now) {
    return cached.email;
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(cleanToken)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Invalid Google token");

  const info = (await res.json()) as {
    aud?: unknown;
    email?: unknown;
    email_verified?: unknown;
    expires_in?: unknown;
  };

  // tokeninfo returns email_verified as the string "true", userinfo as boolean.
  const emailVerified = info.email_verified === true || info.email_verified === "true";

  if (info.aud !== expectedAud) throw new Error("Google token was issued for a different application");
  if (typeof info.email !== "string" || !info.email.trim()) throw new Error("Google token has no email");
  if (!emailVerified) throw new Error("A verified Google email is required");
  const expiresInSec = Number(info.expires_in) || 0;
  if (expiresInSec <= 0) throw new Error("Google token has expired");

  const verifiedEmail = info.email.trim().toLowerCase();

  // Cache token verification in-memory for up to 5 minutes (or token lifetime minus 30s buffer)
  // to avoid repeated 200-400ms Google OAuth network roundtrips during an active extension session.
  if (expiresInSec > 30) {
    if (tokenCache.size >= MAX_CACHE_ENTRIES) {
      tokenCache.forEach((v, k) => {
        if (v.expiresAt <= now) tokenCache.delete(k);
      });
      if (tokenCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = tokenCache.keys().next().value;
        if (oldestKey) tokenCache.delete(oldestKey);
      }
    }
    const ttlMs = Math.min(expiresInSec - 30, 300) * 1000;
    tokenCache.set(cleanToken, {
      email: verifiedEmail,
      expiresAt: now + ttlMs,
    });
  }

  return verifiedEmail;
}
