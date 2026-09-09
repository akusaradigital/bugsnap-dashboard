import { NextResponse } from "next/server";
import { consumeState, finishConnection } from "@/lib/google-drive";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL("/settings", process.env.NEXT_PUBLIC_APP_URL ?? url.origin);
  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || url.searchParams.has("error")) throw new Error("Authorization denied");
    const userId = await consumeState(state);
    await finishConnection(userId, code);
    destination.searchParams.set("drive", "connected");
  } catch (err) {
    const isScopeError = err instanceof Error && /DRIVE_PERMISSION_DENIED|drive\.file|insufficient/i.test(err.message);
    destination.searchParams.set("drive", isScopeError ? "scope_denied" : "error");
  }
  return NextResponse.redirect(destination);
}
