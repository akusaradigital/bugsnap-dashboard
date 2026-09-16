import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isSuperAdminEmail } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ isAdmin: false });

  try {
    const supabase = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user || !user.email) return NextResponse.json({ isAdmin: false });

    return NextResponse.json({ isAdmin: isSuperAdminEmail(user.email) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
