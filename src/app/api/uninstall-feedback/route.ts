import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { validateEmail } from "@/lib/email-validator";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Same notification channel as /api/support/report: admin rarely opens the
// dashboard, so uninstall feedback must reach them by email too, not just land
// silently in the uninstall_feedback table.
const CS_EMAIL = process.env.CS_EMAIL || process.env.SUPER_ADMIN_EMAILS || "contact.akusaraproject@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BugSnap CS <support@bugsnap.akusaraproject.my.id>";
const RESEND_FALLBACK_FROM = "BugSnap CS <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] || ch));
}

async function sendUninstallFeedbackEmail(params: {
  message: string;
  userEmail: string | null;
  extensionVersion: string;
  browser: string;
  os: string;
}) {
  if (!RESEND_API_KEY) return;

  const { message, userEmail, extensionVersion, browser, os } = params;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="border-bottom: 2px solid #DC2626; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="display: inline-block; font-size: 11px; font-weight: 700; color: white; background: #DC2626; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
          UNINSTALL FEEDBACK
        </span>
        <h2 style="margin: 12px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
          A user uninstalled BugSnap
        </h2>
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          Submitted from the post-uninstall feedback page
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          Feedback:
        </h3>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #0f172a;">
          ${escapeHtml(message)}
        </div>
      </div>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; line-height: 1.6;">
        <div><strong>User email:</strong> ${userEmail ? escapeHtml(userEmail) : "Not provided (anonymous)"}</div>
        <div><strong>Extension version:</strong> ${escapeHtml(extensionVersion || "unknown")}</div>
        <div><strong>Browser:</strong> ${escapeHtml(browser || "unknown")}</div>
        <div><strong>OS:</strong> ${escapeHtml(os || "unknown")}</div>
        <div><strong>Time:</strong> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</div>
      </div>
    </div>
  `;

  try {
    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [CS_EMAIL],
        ...(userEmail ? { reply_to: userEmail } : {}),
        subject: `[UNINSTALL] BugSnap feedback${userEmail ? ` from ${userEmail}` : ""}`,
        html,
      }),
    });

    // If the custom domain is pending verification, retry once with the fallback sender.
    if (!resendRes.ok && RESEND_FROM_EMAIL !== RESEND_FALLBACK_FROM) {
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: RESEND_FALLBACK_FROM,
          to: [CS_EMAIL],
          ...(userEmail ? { reply_to: userEmail } : {}),
          subject: `[UNINSTALL] BugSnap feedback${userEmail ? ` from ${userEmail}` : ""}`,
          html,
        }),
      });
    }

    if (!resendRes.ok) {
      const errData = await resendRes.json().catch(() => ({}));
      console.warn("[Uninstall Feedback] Resend API error:", errData.message || `HTTP ${resendRes.status}`);
    }
  } catch (err) {
    console.warn("[Uninstall Feedback] Email dispatch exception:", err);
  }
}

// POST /api/uninstall-feedback - Public, unauthenticated: the extension is
// already gone by the time this page loads (chrome.runtime.setUninstallURL
// opens it after removal), so there is no session and no auth to check.
export async function POST(req: Request) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    undefined;

  try {
    if (await isRateLimited(`uninstall-feedback:${clientIp || "unknown"}`, 5, 3600)) {
      return NextResponse.json(
        { error: "Terlalu banyak laporan. Coba lagi nanti.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim().slice(0, 4000);
    const userEmailRaw = String(body.userEmail || "").trim();
    const extensionVersion = String(body.extensionVersion || "").trim().slice(0, 40);
    const browser = String(body.browser || "").trim().slice(0, 40);
    const os = String(body.os || "").trim().slice(0, 40);
    const locale = String(body.locale || "").trim().slice(0, 20);

    if (!message) {
      return NextResponse.json({ error: "Message is required", code: "MESSAGE_REQUIRED" }, { status: 400 });
    }

    // Email is optional here (anonymous feedback is expected), but if one was
    // typed in, it must be a real address - not a honeypot for spam/garbage.
    let userEmail: string | null = null;
    if (userEmailRaw) {
      const validation = validateEmail(userEmailRaw);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Format email tidak valid.", code: validation.error },
          { status: 400 }
        );
      }
      userEmail = userEmailRaw;
    }

    const db = createServiceClient();
    await db.from("uninstall_feedback").insert({
      id: `uf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      message,
      user_email: userEmail,
      extension_version: extensionVersion || null,
      browser: browser || null,
      os: os || null,
      locale: locale || null,
    });

    // Awaited (not fire-and-forget): a serverless function can be frozen the
    // instant the response is returned, which would silently drop an
    // un-awaited send. The admin rarely opens the dashboard, so this email is
    // the channel that actually reaches them - a delivery failure is caught
    // internally and must not fail the user's submission either way.
    await sendUninstallFeedbackEmail({ message, userEmail, extensionVersion, browser, os });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[Uninstall Feedback] Fatal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
