import { NextResponse } from "next/server";
import { checkAdminCredentials, createAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// A 400ms delay is not a brute-force control — a single client can still try
// thousands of passwords an hour against one fixed admin credential.
const MAX_ATTEMPTS = 8;
const WINDOW_S = 10 * 60;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    // Counted before credentials are checked, so a wrong password and a
    // malformed body both cost an attempt.
    if (await isRateLimited(`admin-login:${ip}`, MAX_ATTEMPTS, WINDOW_S)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
    }

    const valid = await checkAdminCredentials(username, password);
    if (!valid) {
      // Delay response slightly to mitigate brute-force
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json({ error: "Username atau password admin salah." }, { status: 401 });
    }

    const token = createAdminToken(username);

    const response = NextResponse.json({
      ok: true,
      username,
      token,
      message: "Login admin berhasil.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (err) {
    console.error("[Admin Login] Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
