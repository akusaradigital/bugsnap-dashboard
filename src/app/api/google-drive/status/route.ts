import { NextResponse } from "next/server";
import { authenticatedUser, getDriveConnectionHealth, getFastDriveStatus } from "@/lib/google-drive";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const isFast = url.searchParams.get("fast") === "true";
    const result = isFast
      ? await getFastDriveStatus(user.id)
      : await getDriveConnectionHealth(user.id);
    return NextResponse.json({
      status: result.status,
      connected: result.status === "connected",
      email: result.email,
      updatedAt: result.updatedAt,
      message: result.message,
      quota: result.quota ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Unable to read connection" }, { status: 500 });
  }
}
