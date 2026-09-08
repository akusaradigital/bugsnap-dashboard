import { NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Answers "is the caller an admin?" from the httpOnly session cookie.
 *
 * Exists so the client no longer has to keep a copy of the admin token in
 * sessionStorage just to know whether to render the console. The token itself
 * is never returned — that is the whole point.
 */
export async function GET(req: Request) {
  const ok = await isRequestAdminAuthenticated(req);
  return NextResponse.json({ authenticated: ok }, { status: ok ? 200 : 401 });
}
