import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-audit";
import { sanitizeErrorMessage } from "@/lib/redact";
import { normalizeEndpointUrl } from "@/lib/ai-endpoint";

export const runtime = "nodejs";

const SETTINGS_KEY = "site_config";

export interface SiteConfig {
  siteName: string;
  siteDomain: string;
  supportEmail: string;
  chromeExtensionUrl: string;
  allowPublicSignups: boolean;
  requireGoogleDrive: boolean;
  publicCapturesEnabled: boolean;
  defaultRetentionDays: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementActive: boolean;
  announcementText: string;
  announcementLink?: string;
  announcementType: "info" | "warning" | "success";
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: "BugSnap",
  siteDomain: "bugsnap.akusaraproject.my.id",
  supportEmail: "support@akusaradigital.com",
  chromeExtensionUrl: "https://chromewebstore.google.com",
  allowPublicSignups: true,
  requireGoogleDrive: true,
  publicCapturesEnabled: true,
  defaultRetentionDays: 0,
  maintenanceMode: false,
  maintenanceMessage: "BugSnap scheduled server maintenance is in progress. Please check back shortly.",
  announcementActive: false,
  announcementText: "",
  announcementLink: "",
  announcementType: "info",
};

interface ServiceCheck {
  id: string;
  name: string;
  category: string;
  isConfigured: boolean;
  status: "configured" | "missing" | "optional";
  description: string;
  requiredVars: string[];
}

function getEnvStatus(): ServiceCheck[] {
  return [
    {
      id: "supabase",
      name: "Supabase Database & Auth",
      category: "Core Database",
      isConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      status: (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? "configured" : "missing",
      description: "PostgreSQL database, Row Level Security, and OAuth user sessions.",
      requiredVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    },
    {
      id: "google_drive",
      name: "Google OAuth & Drive API",
      category: "Zero Server Storage",
      isConfigured: Boolean(
        process.env.GOOGLE_DRIVE_CLIENT_ID &&
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
      ),
      status: (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET) ? "configured" : "missing",
      description: "Direct streaming of video recordings & screenshots to user's Google Drive.",
      requiredVars: ["GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_CLIENT_SECRET", "GOOGLE_DRIVE_REDIRECT_URI"],
    },
    {
      id: "ai",
      name: "AI Diagnostics & Polish",
      category: "AI Telemetry",
      isConfigured: Boolean(
        process.env.AI_POLISH_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.GROQ_API_KEY
      ),
      status: (process.env.AI_POLISH_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY) ? "configured" : "optional",
      description: "LLM error analysis, root cause clues, and bug summary generation.",
      requiredVars: ["AI_POLISH_API_KEY (or dynamic in Admin AI Analytics)"],
    },
    {
      id: "resend",
      name: "Resend Email Service",
      category: "Communication",
      isConfigured: Boolean(process.env.RESEND_API_KEY),
      status: process.env.RESEND_API_KEY ? "configured" : "optional",
      description: "Notification emails, workspace invitations, and customer support notifications.",
      requiredVars: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "CS_EMAIL"],
    },
    {
      id: "turnstile",
      name: "Cloudflare Turnstile",
      category: "Security",
      isConfigured: Boolean(
        process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY &&
        process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
      ),
      status: (process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY && process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) ? "configured" : "optional",
      description: "Bot detection & CAPTCHA on authentication and public submission routes.",
      requiredVars: ["NEXT_PUBLIC_TURNSTILE_SITEKEY", "CLOUDFLARE_TURNSTILE_SECRET_KEY"],
    },
    {
      id: "paddle",
      name: "Paddle Payments & Billing",
      category: "Monetization",
      isConfigured: Boolean(
        process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
        process.env.PADDLE_WEBHOOK_SECRET_KEY
      ),
      status: (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && process.env.PADDLE_WEBHOOK_SECRET_KEY) ? "configured" : "optional",
      description: "Merchant of Record subscriptions, recurring checkout, and webhooks.",
      requiredVars: ["NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "PADDLE_WEBHOOK_SECRET_KEY"],
    },
    {
      id: "admin_auth",
      name: "Super Admin Credentials",
      category: "Security",
      isConfigured: Boolean(
        (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) ||
        process.env.SUPER_ADMIN_EMAILS
      ),
      status: ((process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) || process.env.SUPER_ADMIN_EMAILS) ? "configured" : "missing",
      description: "Super admin access credentials and authorization whitelist.",
      requiredVars: ["ADMIN_USERNAME", "ADMIN_PASSWORD", "SUPER_ADMIN_EMAILS"],
    },
    {
      id: "cron",
      name: "Cron & Maintenance Secret",
      category: "Automation",
      isConfigured: Boolean(process.env.CRON_SECRET),
      status: process.env.CRON_SECRET ? "configured" : "optional",
      description: "Protected background jobs for capture cleanup and error spike alerts.",
      requiredVars: ["CRON_SECRET"],
    },
  ];
}

export async function GET(req: NextRequest) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const origin = req.nextUrl?.origin || "https://bugsnap.akusaraproject.my.id";

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const stored = (data?.value as Partial<SiteConfig>) || {};
    const config: SiteConfig = {
      siteName: stored.siteName || DEFAULT_CONFIG.siteName,
      siteDomain: stored.siteDomain || DEFAULT_CONFIG.siteDomain,
      supportEmail: stored.supportEmail || DEFAULT_CONFIG.supportEmail,
      chromeExtensionUrl: stored.chromeExtensionUrl || DEFAULT_CONFIG.chromeExtensionUrl,
      allowPublicSignups: stored.allowPublicSignups !== false,
      requireGoogleDrive: stored.requireGoogleDrive !== false,
      publicCapturesEnabled: stored.publicCapturesEnabled !== false,
      defaultRetentionDays: typeof stored.defaultRetentionDays === "number" ? stored.defaultRetentionDays : 0,
      maintenanceMode: Boolean(stored.maintenanceMode),
      maintenanceMessage: stored.maintenanceMessage || DEFAULT_CONFIG.maintenanceMessage,
      announcementActive: Boolean(stored.announcementActive),
      announcementText: stored.announcementText || "",
      announcementLink: stored.announcementLink || "",
      announcementType: stored.announcementType || "info",
      updatedAt: data?.updated_at,
      updatedBy: stored.updatedBy,
    };

    const services = getEnvStatus();
    const configuredCount = services.filter((s) => s.isConfigured).length;
    const readinessPercentage = Math.round((configuredCount / services.length) * 100);

    const callbackUrls = {
      googleOAuthRedirect: `${origin}/api/google-drive/callback`,
      googleJsOrigin: origin,
      paddleWebhook: `${origin}/api/paddle-webhook`,
      stripeWebhook: `${origin}/api/stripe-webhook`,
      mcpPublicApi: `${origin}/api/public/v1/captures`,
      extensionConfigApi: `${origin}/api/extension/config`,
    };

    return NextResponse.json({
      ok: true,
      config,
      services,
      readiness: {
        configured: configuredCount,
        total: services.length,
        percentage: readinessPercentage,
        isProductionReady: readinessPercentage >= 75,
      },
      callbackUrls,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, "Failed to load admin setup configuration") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { authorized, callerEmail, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => null)) as Partial<SiteConfig> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const siteName = typeof body.siteName === "string" && body.siteName.trim()
      ? body.siteName.trim().slice(0, 80)
      : DEFAULT_CONFIG.siteName;

    const siteDomain = typeof body.siteDomain === "string" && body.siteDomain.trim()
      ? body.siteDomain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "").slice(0, 100)
      : DEFAULT_CONFIG.siteDomain;

    const supportEmail = typeof body.supportEmail === "string" && body.supportEmail.trim()
      ? body.supportEmail.trim().slice(0, 120)
      : DEFAULT_CONFIG.supportEmail;

    const chromeExtensionUrl = typeof body.chromeExtensionUrl === "string" && body.chromeExtensionUrl.trim()
      ? body.chromeExtensionUrl.trim().slice(0, 300)
      : DEFAULT_CONFIG.chromeExtensionUrl;

    const updatedConfig: SiteConfig = {
      siteName,
      siteDomain,
      supportEmail,
      chromeExtensionUrl,
      allowPublicSignups: body.allowPublicSignups !== false,
      requireGoogleDrive: body.requireGoogleDrive !== false,
      publicCapturesEnabled: body.publicCapturesEnabled !== false,
      defaultRetentionDays: typeof body.defaultRetentionDays === "number" && [0, 30, 60, 90, 180].includes(body.defaultRetentionDays)
        ? body.defaultRetentionDays
        : 0,
      maintenanceMode: Boolean(body.maintenanceMode),
      maintenanceMessage: typeof body.maintenanceMessage === "string" && body.maintenanceMessage.trim()
        ? body.maintenanceMessage.trim().slice(0, 300)
        : DEFAULT_CONFIG.maintenanceMessage,
      announcementActive: Boolean(body.announcementActive),
      announcementText: typeof body.announcementText === "string" ? body.announcementText.trim().slice(0, 200) : "",
      announcementLink: typeof body.announcementLink === "string" ? body.announcementLink.trim().slice(0, 200) : "",
      announcementType: body.announcementType === "warning" || body.announcementType === "success" ? body.announcementType : "info",
      updatedAt: new Date().toISOString(),
      updatedBy: callerEmail || "Super Admin",
    };

    const { error } = await supabase.from("app_settings").upsert({
      key: SETTINGS_KEY,
      value: updatedConfig,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    await logSecurityEvent({
      type: "admin_action",
      title: "Site Configuration Updated",
      detail: `Admin ${callerEmail || "Console"} updated global website setup (maintenance: ${updatedConfig.maintenanceMode}, signups: ${updatedConfig.allowPublicSignups})`,
    });

    return NextResponse.json({ ok: true, config: updatedConfig });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, "Failed to save site configuration") },
      { status: 500 }
    );
  }
}

// PUT /api/admin/setup: Quick live diagnostic probe
export async function PUT(req: NextRequest) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => null)) as { action?: string } | null;
    const action = body?.action;

    if (action === "test_db") {
      const start = Date.now();
      const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true });
      const latencyMs = Date.now() - start;
      if (error) {
        return NextResponse.json({ ok: false, error: error.message, latencyMs }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        message: `Database connected. ${count ?? 0} users indexed.`,
        latencyMs,
      });
    }

    if (action === "test_ai") {
      const { data: aiRow } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ai_polish_config")
        .maybeSingle();

      const aiConfig = (aiRow?.value as Record<string, unknown>) || {};
      const endpoint = normalizeEndpointUrl(
        (aiConfig.endpointUrl as string) || "https://openrouter.ai/api/v1/chat/completions"
      );
      const apiKey = (aiConfig.apiKey as string) || process.env.AI_POLISH_API_KEY || process.env.OPENROUTER_API_KEY || "";
      const model = (aiConfig.model as string) || "qwen/qwen-2.5-72b-instruct";

      if (!apiKey) {
        return NextResponse.json({ ok: false, error: "No AI API key configured in Admin AI Analytics or .env" }, { status: 400 });
      }

      const start = Date.now();
      const testRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with the single word: OK" }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Date.now() - start;
      if (!testRes.ok) {
        const txt = await testRes.text();
        return NextResponse.json({ ok: false, error: `HTTP ${testRes.status}: ${txt.slice(0, 150)}`, latencyMs }, { status: 502 });
      }

      return NextResponse.json({
        ok: true,
        message: `AI Model (${model}) replied successfully.`,
        latencyMs,
      });
    }

    return NextResponse.json({ error: "Unknown diagnostic action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: sanitizeErrorMessage(err, "Diagnostic test failed") },
      { status: 500 }
    );
  }
}
