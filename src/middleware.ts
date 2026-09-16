import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers and transport-level controls for every response.
 *
 * Route interception note:
 * 1. UI routes at /admin/* handle authentication client-side within src/app/admin/layout.tsx
 *    by rendering an in-place login lock screen when unauthenticated. Middleware must NOT
 *    redirect or block /admin page requests, which would break login form rendering.
 * 2. API routes at /api/admin/* enforce authorization directly in their respective route handlers
 *    to support dual authentication (bugsnap_admin_session cookie + Google/Supabase Bearer tokens)
 *    without incurring external auth network hops on the Edge runtime.
 * 3. Mutating requests to /api/admin/* enforce early CSRF origin verification here.
 */

const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Next.js injects inline bootstrap scripts and styled-jsx style tags, so
// script-src and style-src need 'unsafe-inline'. Everything else is locked
// down — most importantly frame-ancestors, object-src and base-uri, which are
// what actually stop clickjacking and base-tag injection.
// ponytail: nonce-based script-src is the upgrade; it needs every inline
// script to thread a per-request nonce, which is a much larger change.
function buildCsp(): string {
  const connect = [
    "'self'",
    SUPABASE_ORIGIN,
    "https://challenges.cloudflare.com",
    "https://www.googleapis.com",
    "https://drive.google.com",
  ].filter(Boolean);

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    // Capture thumbnails and Google avatars are remote; data: covers inline SVG.
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https://drive.google.com https://www.googleapis.com",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "frame-src https://challenges.cloudflare.com https://drive.google.com",
    // The dashboard is never meant to be embedded — this is the clickjacking fix.
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Early CSRF protection for mutating admin API requests: reject cross-origin callers
  if (pathname.startsWith("/api/admin/") && ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(JSON.stringify({ error: "Forbidden: Cross-origin request rejected" }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "X-Frame-Options": "DENY",
              "Content-Security-Policy": "frame-ancestors 'none'",
            },
          });
        }
      } catch {
        return new NextResponse(JSON.stringify({ error: "Forbidden: Invalid origin" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Frame-Options": "DENY",
            "Content-Security-Policy": "frame-ancestors 'none'",
          },
        });
      }
    }
  }

  const res = NextResponse.next();

  res.headers.set("Content-Security-Policy", buildCsp());
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), geolocation=(), interest-cohort=()");
  // Only meaningful over HTTPS; harmless on localhost since browsers ignore it there.
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export const config = {
  // Skip Next internals and static assets — they need no policy and this keeps
  // the middleware off the hot path for every image request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
