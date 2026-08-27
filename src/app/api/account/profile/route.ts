import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { fullName?: unknown; avatarUrl?: unknown } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: { full_name?: string | null; avatar_url?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.fullName === "string") {
    const fullName = body.fullName.trim();
    if (fullName.length > 120) {
      return NextResponse.json({ error: "Full name must be 120 characters or less" }, { status: 400 });
    }
    updates.full_name = fullName || null;
  }

  if (typeof body.avatarUrl === "string") {
    const avatarUrl = body.avatarUrl.trim();
    if (avatarUrl.length > 1000) {
      return NextResponse.json({ error: "Avatar URL is too long" }, { status: 400 });
    }
    if (avatarUrl) {
      try {
        const parsed = new URL(avatarUrl);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
      } catch {
        return NextResponse.json({ error: "Avatar URL must be a valid HTTP or HTTPS URL" }, { status: 400 });
      }
    }
    updates.avatar_url = avatarUrl || "https://bugsnap.akusaraproject.my.id/icon.svg";
  }

  const db = createServiceClient();
  const { error } = await db
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Unable to save profile" }, { status: 500 });

  return NextResponse.json({ success: true, ...updates });
}
