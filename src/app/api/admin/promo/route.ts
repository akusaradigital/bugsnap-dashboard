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

  const supabase = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.email) {
      if (getAdminEmails().includes(user.email.toLowerCase())) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";
    const enabled = Boolean(body?.enabled);

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "promo_banner", value: { message, enabled }, updated_at: new Date().toISOString() });

    if (error) throw error;

    return NextResponse.json({ ok: true, promo: { message, enabled } });
  } catch (err) {
    console.error("Admin promo update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
