import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const getAdminEmails = () =>
  (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function POST(req: Request) {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  let authorized = isAdminAuthenticated;
  let callerUserId: string | null = null;

  const supabase = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.email) {
      if (getAdminEmails().includes(user.email.toLowerCase())) {
        authorized = true;
        callerUserId = user.id;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const targetUserId = body?.user_id;
    const suspended = Boolean(body?.suspended);

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    if (callerUserId && targetUserId === callerUserId) {
      return NextResponse.json({ error: "You cannot suspend your own account" }, { status: 400 });
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
