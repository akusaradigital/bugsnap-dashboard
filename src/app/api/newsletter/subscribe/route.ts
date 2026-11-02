import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { validateEmail } from "@/lib/email-validator";
import { isRateLimited, clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BugSnap <contact.akusaraproject@gmail.com>";

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Rate limit: max 10 attempts per minute per IP
  if (await isRateLimited(`newsletter_sub:${ip}`, 10, 60)) {
    return NextResponse.json(
      { error: "Too many subscription attempts. Please try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string; source?: string; hp_field?: string };

    // Honeypot check
    if (body.hp_field) {
      await logSecurityEvent({
        type: "honeypot_trap",
        title: "Bot Trapped in Newsletter Honeypot",
        detail: `Honeypot filled: "${String(body.hp_field).slice(0, 60)}"`,
        ip,
      });
      return NextResponse.json({ ok: true });
    }

    const rawEmail = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "blog").slice(0, 50);

    const validation = validateEmail(rawEmail);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || "Please enter a valid email address.", code: validation.error },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Upsert into newsletter_subscribers
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: rawEmail,
          source,
          is_active: true,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (dbError) {
      console.error("[newsletter-subscribe] DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save subscription. Please try again.", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    // Optional welcome email via Resend
    if (RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: [rawEmail],
          subject: "Welcome to BugSnap Newsletter",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b; line-height: 1.6;">
              <div style="margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">Welcome to BugSnap Articles</h1>
                <p style="font-size: 14px; color: #64748b; margin: 0;">Practical tutorials, DevTools debugging guides, and developer productivity insights.</p>
              </div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 14px; color: #334155;">
                <p style="margin: 0 0 12px 0;">Hi there,</p>
                <p style="margin: 0 0 12px 0;">Thank you for subscribing! You will receive our latest articles, real-world bug recreation tips, and engineering updates straight to your inbox.</p>
                <p style="margin: 0;">No spam, ever. You can unsubscribe at any time.</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent by the BugSnap Team · Zero-Server-Storage Bug Reporting</p>
            </div>
          `,
        }),
      }).catch((err) => console.warn("[newsletter-subscribe] Welcome email failed:", err));
    }

    return NextResponse.json({ ok: true, message: "Subscribed successfully" });
  } catch (err: unknown) {
    console.error("[newsletter-subscribe] Unexpected error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
