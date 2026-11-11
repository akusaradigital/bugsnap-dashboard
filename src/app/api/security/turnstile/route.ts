import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "TOKEN_REQUIRED" }, { status: 400 });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const result = await verifyTurnstileToken(token, ip);

  if (result.error === "TURNSTILE_SECRET_MISSING") {
    console.error("[Turnstile] Server secret is not configured");
    return NextResponse.json({ ok: false, error: "TURNSTILE_UNAVAILABLE" }, { status: 503 });
  }
  if (result.error === "TURNSTILE_UNAVAILABLE") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
  }

  return NextResponse.json({
    ok: result.success,
    ...(result.success ? {} : { errorCodes: result.errorCodes }),
  }, { status: result.success ? 200 : 403 });
}
