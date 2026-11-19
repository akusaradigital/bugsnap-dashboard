import { NextResponse } from "next/server";
import { consumeState, finishConnection, decrypt } from "@/lib/google-drive";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseOrigin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  let targetPath = "/settings?tab=integrations";

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  try {
    if (!code || !state || url.searchParams.has("error")) throw new Error("Authorization denied");
    const { userId, returnTo } = await consumeState(state);
    if (returnTo && /^\/(?!\/|\\)/.test(returnTo) && !returnTo.startsWith("/login")) {
      targetPath = returnTo;
    }
    await finishConnection(userId, code);
    const destination = new URL(targetPath, baseOrigin);
    destination.searchParams.set("drive", "connected");
    return NextResponse.redirect(destination);
  } catch (err) {
    if (state) {
      try {
        const parsed = JSON.parse(decrypt(state)) as { returnTo?: string };
        if (parsed.returnTo && /^\/(?!\/|\\)/.test(parsed.returnTo) && !parsed.returnTo.startsWith("/login")) {
          targetPath = parsed.returnTo;
        }
      } catch {
        // ignore decryption error
      }
    }
    const destination = new URL(targetPath, baseOrigin);
    if (destination.pathname === "/settings" && !destination.searchParams.has("tab")) {
      destination.searchParams.set("tab", "integrations");
    }
    const isScopeError = err instanceof Error && /DRIVE_PERMISSION_DENIED|drive\.file|insufficient/i.test(err.message);
    destination.searchParams.set("drive", isScopeError ? "scope_denied" : "error");
    return NextResponse.redirect(destination);
  }
}
