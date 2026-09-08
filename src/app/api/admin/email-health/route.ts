import { NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BugSnap CS <support@bugsnap.akusaraproject.my.id>";
const CS_EMAIL = process.env.CS_EMAIL || process.env.SUPER_ADMIN_EMAILS || "contact.akusaraproject@gmail.com";

// GET /api/admin/email-health
export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const hasApiKey = Boolean(RESEND_API_KEY);
  const maskedKey = RESEND_API_KEY
    ? `${RESEND_API_KEY.slice(0, 7)}••••••••${RESEND_API_KEY.slice(-4)}`
    : "Not Set";

  let apiReachable = false;
  let latencyMs = 0;
  let domains: Array<{ id: string; name: string; status: string; created_at: string }> = [];
  let apiError: string | null = null;

  if (hasApiKey) {
    const start = Date.now();
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      });
      latencyMs = Date.now() - start;

      if (res.ok) {
        apiReachable = true;
        const data = await res.json().catch(() => ({}));
        domains = Array.isArray(data?.data) ? data.data : [];
      } else {
        const errJson = await res.json().catch(() => ({}));
        apiError = errJson?.message || `HTTP ${res.status}`;
      }
    } catch (err: unknown) {
      latencyMs = Date.now() - start;
      apiError = (err as Error)?.message || "Resend endpoint unreachable";
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
    const recipient = String(body?.recipient || CS_EMAIL).trim();

    const start = Date.now();
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a; margin-top: 0;">🧪 BugSnap Email Health Diagnostic Probe</h2>
        <p style="color: #475569; font-size: 14px;">
          Email ini adalah pengujian langsung (health probe) dari BugSnap Admin Console.
        </p>
        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #334155;">
          <div><strong>Sender:</strong> ${RESEND_FROM_EMAIL}</div>
          <div><strong>Recipient:</strong> ${recipient}</div>
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
    });

    const latencyMs = Date.now() - start;
    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: resData.message || `Resend Error HTTP ${res.status}`, latencyMs },
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
    return NextResponse.json({ error: (err as Error)?.message || "Failed to send test probe" }, { status: 500 });
  }
}
