import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

interface PingResult {
  id: string;
  name: string;
  icon: string;
  category: string;
  status: "healthy" | "degraded" | "down" | "not_configured";
  latencyMs: number;
  message: string;
  details?: Record<string, unknown>;
}

export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const results: PingResult[] = [];

  // 1. Supabase Postgres & Auth Ping
  const dbStart = Date.now();
  try {
    const db = createServiceClient();
    const { count, error } = await db.from("users").select("*", { count: "exact", head: true });
    const latencyMs = Date.now() - dbStart;
    if (error) {
      results.push({
        id: "supabase",
        name: "Supabase DB & Auth",
        icon: "⚡",
        category: "Database & Session",
        status: "degraded",
        latencyMs,
        message: `Error: ${error.message}`,
      });
    } else {
      results.push({
        id: "supabase",
        name: "Supabase DB & Auth",
        icon: "⚡",
        category: "Database & Session",
        status: "healthy",
        latencyMs,
        message: `Database terhubung (${count ?? 0} total pengguna terindeks)`,
      });
    }
  } catch (err: unknown) {
    results.push({
      id: "supabase",
      name: "Supabase DB & Auth",
      icon: "⚡",
      category: "Database & Session",
      status: "down",
      latencyMs: Date.now() - dbStart,
      message: (err as Error)?.message || "Supabase database unreachable",
    });
  }

  // 2. Google Drive OAuth API
  const gdriveStart = Date.now();
  const hasGdriveClient = Boolean(process.env.GOOGLE_DRIVE_CLIENT_ID);
  const hasGdriveSecret = Boolean(process.env.GOOGLE_DRIVE_CLIENT_SECRET);
  if (!hasGdriveClient || !hasGdriveSecret) {
    results.push({
      id: "gdrive",
      name: "Google Drive OAuth",
      icon: "📁",
      category: "Cloud Storage",
      status: "not_configured",
      latencyMs: 0,
      message: "GOOGLE_DRIVE_CLIENT_ID / SECRET belum disetel di server",
    });
  } else {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=probe", {
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Date.now() - gdriveStart;
      // 400 is expected for dummy token, which proves Google Auth endpoint is alive and responsive
      if (res.status === 400 || res.status === 200) {
        results.push({
          id: "gdrive",
          name: "Google Drive OAuth",
          icon: "📁",
          category: "Cloud Storage",
          status: "healthy",
          latencyMs,
          message: "Google OAuth gateway online & responsif",
        });
      } else {
        results.push({
          id: "gdrive",
          name: "Google Drive OAuth",
          icon: "📁",
          category: "Cloud Storage",
          status: "degraded",
          latencyMs,
          message: `Google API status: HTTP ${res.status}`,
        });
      }
    } catch (err: unknown) {
      results.push({
        id: "gdrive",
        name: "Google Drive OAuth",
        icon: "📁",
        category: "Cloud Storage",
        status: "down",
        latencyMs: Date.now() - gdriveStart,
        message: (err as Error)?.message || "Google OAuth unreachable",
      });
    }
  }

  // 3. Resend Email Delivery
  const resendStart = Date.now();
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    results.push({
      id: "resend",
      name: "Resend Email API",
      icon: "✉️",
      category: "Notification & Email",
      status: "not_configured",
      latencyMs: 0,
      message: "RESEND_API_KEY belum disetel di server",
    });
  } else {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Date.now() - resendStart;
      if (res.ok) {
        results.push({
          id: "resend",
          name: "Resend Email API",
          icon: "✉️",
          category: "Notification & Email",
          status: "healthy",
          latencyMs,
          message: "Resend API authenticated & siap kirim email",
        });
      } else {
        results.push({
          id: "resend",
          name: "Resend Email API",
          icon: "✉️",
          category: "Notification & Email",
          status: "degraded",
          latencyMs,
          message: `Resend auth issue: HTTP ${res.status}`,
        });
      }
    } catch (err: unknown) {
      results.push({
        id: "resend",
        name: "Resend Email API",
        icon: "✉️",
        category: "Notification & Email",
        status: "down",
        latencyMs: Date.now() - resendStart,
        message: (err as Error)?.message || "api.resend.com unreachable",
      });
    }
  }

  // 4. Cloudflare Turnstile Anti-Bot
  const cfStart = Date.now();
  const cfSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "";
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(cfSecret)}&response=probe`,
      signal: AbortSignal.timeout(4000),
    });
    const latencyMs = Date.now() - cfStart;
    if (res.ok) {
      results.push({
        id: "turnstile",
        name: "Cloudflare Turnstile",
        icon: "🛡️",
        category: "Security & Anti-Bot",
        status: "healthy",
        latencyMs,
        message: "Cloudflare challenge engine online",
      });
    } else {
      results.push({
        id: "turnstile",
        name: "Cloudflare Turnstile",
        icon: "🛡️",
        category: "Security & Anti-Bot",
        status: "degraded",
        latencyMs,
        message: `HTTP ${res.status}`,
      });
    }
  } catch (err: unknown) {
    results.push({
      id: "turnstile",
      name: "Cloudflare Turnstile",
      icon: "🛡️",
      category: "Security & Anti-Bot",
      status: "down",
      latencyMs: Date.now() - cfStart,
      message: (err as Error)?.message || "Cloudflare unreachable",
    });
  }

  // 5. AI Bug Summary Provider
  const aiStart = Date.now();
  const aiProvider = process.env.CUSTOM_ROUTER_API_KEY
    ? "custom_router"
    : process.env.OPENROUTER_API_KEY
    ? "openrouter"
    : process.env.OPENAI_API_KEY
    ? "openai"
    : null;

  if (!aiProvider) {
    results.push({
      id: "ai",
      name: "AI Summary Engine",
      icon: "🤖",
      category: "Machine Learning",
      status: "not_configured",
      latencyMs: 0,
      message: "Tidak ada API key AI yang dikonfigurasi",
    });
  } else {
    results.push({
      id: "ai",
      name: "AI Summary Engine",
      icon: "🤖",
      category: "Machine Learning",
      status: "healthy",
      latencyMs: Date.now() - aiStart,
      message: `Terkonfigurasi via provider "${aiProvider}"`,
    });
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: results,
  });
}
