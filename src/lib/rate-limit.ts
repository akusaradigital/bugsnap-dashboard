import "server-only";
import { createServiceClient } from "@/lib/supabase-server";

/**
 * Shared, cross-instance rate limit backed by public.rate_limits.
 *
 * Returns true when the caller is OVER the limit and should be rejected.
 *
 * Fails OPEN on a database error: the limiter protects against abuse, but a
 * Supabase blip must not lock every admin out or break error reporting. The
 * routes that gate on real credentials still do so.
 */
export async function isRateLimited(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const db = createServiceClient();
    const { data, error } = await db.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_s: windowSeconds,
    });
    if (error) {
      console.warn("[rate-limit] rpc failed, allowing through:", error.message);
      return false;
    }
    return data === true;
  } catch (err) {
    console.warn("[rate-limit] unavailable, allowing through:", err);
    return false;
  }
}

/** First forwarded client IP, or "unknown". Used to key anonymous limits. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
