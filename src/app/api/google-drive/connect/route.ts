import { NextResponse } from "next/server";
import { authenticatedUser, createConnectUrl } from "@/lib/google-drive";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = await createConnectUrl(user.id);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/google-drive/connect] Failed to create connect URL:", err);
    return NextResponse.json({
      error: "Unable to start Google authorization",
      details: message
    }, { status: 500 });
  }
}
