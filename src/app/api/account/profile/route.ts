import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { fullName?: unknown } | null;
  if (!body || typeof body.fullName !== "string") {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const fullName = body.fullName.trim();
  if (fullName.length > 120) {
    return NextResponse.json({ error: "Full name must be 120 characters or less" }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db
    .from("users")
    .update({ full_name: fullName || null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Unable to save profile" }, { status: 500 });

  return NextResponse.json({ fullName });
}
