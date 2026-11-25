export interface DownloadCachePolicyInput {
  access_mode?: "public" | "members" | null;
  password?: string | null;
  allowed_ips?: string[] | null;
  burn_after_read?: boolean | null;
  expires_at?: string | null;
}

const MAX_PUBLIC_CDN_TTL_S = 86400; // 24 hours

/**
 * Computes the HTTP Cache-Control header for /api/google-drive/download.
 *
 * Public captures without password, IP allowlist, or burn-after-read can be
 * cached on Vercel's Edge CDN (`public, s-maxage=...`) so repeated views and
 * seeks do not re-invoke the serverless function and consume Fast Origin Transfer.
 * Private / restricted captures remain strictly non-CDN-cached.
 */
export function resolveDownloadCacheControl(
  cap: DownloadCachePolicyInput,
  nowMs: number = Date.now(),
): string {
  if (cap.burn_after_read) {
    return "private, no-store";
  }

  const isRestricted =
    cap.access_mode === "members" ||
    Boolean(cap.password) ||
    (Array.isArray(cap.allowed_ips) && cap.allowed_ips.length > 0);

  if (isRestricted) {
    return "private, max-age=3600, stale-while-revalidate=86400";
  }

  let sMaxAge = MAX_PUBLIC_CDN_TTL_S;
  if (cap.expires_at) {
    const expiresMs = new Date(cap.expires_at).getTime();
    if (Number.isFinite(expiresMs)) {
      const remainingSec = Math.floor((expiresMs - nowMs) / 1000);
      if (remainingSec <= 0) {
        return "private, no-store";
      }
      sMaxAge = Math.min(MAX_PUBLIC_CDN_TTL_S, remainingSec);
    }
  }

  return `public, s-maxage=${sMaxAge}, max-age=3600, stale-while-revalidate=86400`;
}
