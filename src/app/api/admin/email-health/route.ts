import { NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { sanitizeErrorMessage } from "@/lib/redact";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BugSnap CS <support@bugsnap.akusaraproject.my.id>";
const CS_EMAIL = process.env.CS_EMAIL || process.env.SUPER_ADMIN_EMAILS || "contact.akusaraproject@gmail.com";

function maskApiKey(key?: string): string {
  if (!key) return "Not Set";
  if (key.length <= 10) return "••••••••";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// GET /api/admin/email-health
export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const hasApiKey = Boolean(RESEND_API_KEY);
  const maskedKey = maskApiKey(RESEND_API_KEY);

  let apiReachable = false;
  let latencyMs = 0;
  let domains: Array<{ id: string; name: string; status: string; created_at: string }> = [];
  let apiError: string | null = null;

  if (hasApiKey) {
    const start = Date.now();
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      latencyMs = Date.now() - start;

      if (res.ok) {
        apiReachable = true;
        const data = await res.json().catch(() => ({}));
        domains = Array.isArray(data?.data) ? data.data : [];
      } else {
        const errJson = await res.json().catch(() => ({}));
        apiError = sanitizeErrorMessage(errJson?.message || `HTTP ${res.status}`, "Resend API error");
      }
    } catch (err: unknown) {
      latencyMs = Date.now() - start;
      apiError = sanitizeErrorMessage(err, "Resend endpoint unreachable");
    }
  }

  return NextResponse.json({
    ok: true,
    configured: hasApiKey,
    maskedKey,
    fromEmail: RESEND_FROM_EMAIL,
    csTargetEmail: CS_EMAIL,
    apiReachable,
    latencyMs,
    domains,
    error: apiError,
  });
}

// POST /api/admin/email-health - Send probe test email
export async function POST(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY tidak dikonfigurasi di server." }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawRecipient = typeof body?.recipient === "string" ? body.recipient.trim() : "";
    const recipient = rawRecipient || CS_EMAIL;

    // Strict validation against header injection and malformed emails
    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(recipient) ||
      recipient.includes("\r") ||
      recipient.includes("\n")
    ) {
      return NextResponse.json({ error: "Invalid recipient email address" }, { status: 400 });
    }

    const start = Date.now();
    const safeRecipient = escapeHtml(recipient);
    const safeFrom = escapeHtml(RESEND_FROM_EMAIL);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a; margin-top: 0;">🧪 BugSnap Email Health Diagnostic Probe</h2>
        <p style="color: #475569; font-size: 14px;">
          Email ini adalah pengujian langsung (health probe) dari BugSnap Admin Console.
        </p>
        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #334155;">
          <div><strong>Sender:</strong> ${safeFrom}</div>
          <div><strong>Recipient:</strong> ${safeRecipient}</div>
          <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
        </div>
        <p style="font-size: 12px; color: #10b981; font-weight: bold; margin-top: 16px;">
          ✓ Delivery route Resend aktif dan terverifikasi.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [recipient],
        subject: `[PROBE] BugSnap Email Delivery Health Test - ${new Date().toLocaleTimeString("id-ID")}`,
        html,
      }),
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - start;
    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: sanitizeErrorMessage(resData.message || `Resend Error HTTP ${res.status}`), latencyMs },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: resData.id,
      recipient,
      latencyMs,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: sanitizeErrorMessage(err, "Failed to send test probe") }, { status: 500 });
  }
}
