import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createAdminToken, ADMIN_COOKIE_NAME, isSuperAdminEmail } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Token autentikasi tidak ditemukan." }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const authRes = await serviceClient.auth.getUser(token);

    if (authRes.error || !authRes.data?.user || !authRes.data.user.email) {
      return NextResponse.json({ error: "Gagal memverifikasi akun Google." }, { status: 401 });
    }

    const user = authRes.data.user;
    const userEmail = (user.email || "").trim().toLowerCase();

    // STRICT WHITELIST: Only authorized Super Admin emails are allowed
    if (!isSuperAdminEmail(userEmail)) {
      return NextResponse.json(
        {
          error: `Akses ditolak: Email "${user.email}" tidak diizinkan mengakses Admin Console. Hanya akun Super Admin yang berhak masuk.`,
        },
        { status: 403 }
      );
    }

    const adminToken = createAdminToken(userEmail);

    const response = NextResponse.json({
      ok: true,
      username: userEmail,
      message: "Login admin via Google berhasil.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: adminToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (err) {
    console.error("[Admin Google Login] Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server internal." }, { status: 500 });
  }
}
