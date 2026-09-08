import { NextResponse } from "next/server";
import { isRequestAdminAuthenticated, checkAdminCredentials, hashAdminPassword } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";
import { logSecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const isAuth = await isRequestAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized: Hanya Super Admin yang berhak." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Password saat ini dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password baru minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Verify current password. The username comes from env, not a literal —
    // a hardcoded one silently breaks the check if ADMIN_USERNAME ever changes.
    const isCurrentValid = await checkAdminCredentials(
      process.env.ADMIN_USERNAME || "",
      currentPassword
    );
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Password saat ini tidak sesuai." },
        { status: 400 }
      );
    }

    // Hash and store new password
    const { hash, salt } = hashAdminPassword(newPassword);
    const db = createServiceClient();

    const { error: upsertError } = await db.from("app_settings").upsert(
      {
        key: "admin_custom_credentials",
        value: {
          hash,
          salt,
          updated_at: new Date().toISOString(),
        },
      },
      { onConflict: "key" }
    );

    if (upsertError) {
      throw upsertError;
    }

    // Audit log
    await logSecurityEvent({
      type: "admin_password_change",
      title: "Ganti Password Admin",
      detail: "Admin credential password changed successfully",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] || "admin-action",
    });

    return NextResponse.json({
      ok: true,
      message: "Password admin berhasil diperbarui.",
    });
  } catch (err: unknown) {
    console.error("[Change Password Error]:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal mengubah password." },
      { status: 500 }
    );
  }
}
