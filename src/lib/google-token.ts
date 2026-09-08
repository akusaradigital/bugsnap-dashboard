import "server-only";

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
    .replace(/^[﻿​-‍￾]+|[﻿​-‍￾]+$/g, "")
    .trim();
  if (!expectedAud) throw new Error("GOOGLE_DRIVE_CLIENT_ID is not configured");

  if (typeof accessToken !== "string" || !accessToken.trim()) {
    throw new Error("Invalid Google token");
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken.trim())}`,
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
  if (Number(info.expires_in) <= 0) throw new Error("Google token has expired");

  return info.email.trim().toLowerCase();
}
