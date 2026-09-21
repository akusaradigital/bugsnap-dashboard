import { NextResponse } from "next/server";
import { checkAdminAuth, isSuperAdminEmail } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { authorized, callerUserId, callerEmail, supabase } = await checkAdminAuth(req);

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const targetUserId = body?.user_id;
    const suspended = Boolean(body?.suspended);

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const { data: targetUser, error: fetchErr } = await supabase
      .from("users")
      .select("id, email, suspended")
      .eq("id", targetUserId)
      .maybeSingle();

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      (callerUserId && targetUserId === callerUserId) ||
      (callerEmail && targetUser.email?.toLowerCase() === callerEmail.toLowerCase())
    ) {
      return NextResponse.json({ error: "You cannot suspend your own account" }, { status: 400 });
    }

    if (suspended && isSuperAdminEmail(targetUser.email)) {
      return NextResponse.json({ error: "Super admin accounts cannot be suspended" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ suspended })
      .eq("id", targetUserId)
      .select("id, email, suspended")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, user: data });
  } catch (err) {
    console.error("Admin toggle-suspend error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
