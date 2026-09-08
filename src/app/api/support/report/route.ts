import { NextResponse } from "next/server";
import { getAuthenticatedUser, createServiceClient } from "@/lib/supabase-server";
import { validateEmail } from "@/lib/email-validator";
import { logSecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

const CS_EMAIL = process.env.CS_EMAIL || process.env.SUPER_ADMIN_EMAILS || "contact.akusaraproject@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BugSnap CS <support@bugsnap.akusaraproject.my.id>";
const RESEND_FALLBACK_FROM = "BugSnap CS <onboarding@resend.dev>";
const TURNSTILE_SECRET = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] || ch));
}

export async function POST(req: Request) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    undefined;

  try {
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const body = await req.json().catch(() => ({}));

    // 1. Honeypot check: reject bots that blindly fill invisible fields
    const honeypot = String(body.hp_website || "").trim();
    if (honeypot) {
      console.warn("[CS Support Report] Honeypot triggered, dropping bot spam silently.");
      await logSecurityEvent({
        type: "honeypot_trap",
        title: "Bot Trapped in Honeypot",
        detail: `Bot filled hidden honeypot: "${honeypot.slice(0, 60)}"`,
        ip: clientIp,
      });
      return NextResponse.json({
        ok: true,
        emailSent: false,
        note: "Laporan diterima.",
      });
    }

    const category = String(body.category || "other").trim().toLowerCase();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const userEmail = String(body.userEmail || authUser?.email || "").trim();
    const pageUrl = String(body.pageUrl || "").trim();
    const userAgent = String(body.userAgent || "").trim();
    const turnstileToken = String(body.turnstileToken || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required", code: "MESSAGE_REQUIRED" }, { status: 400 });
    }

    // 2. Strict Email Validation (anti-spam & deliverability)
    const emailValidation = validateEmail(userEmail);
    if (!emailValidation.valid) {
      let friendlyError = "Format email tidak valid. Harap gunakan email aktif.";
      if (emailValidation.error === "REQUIRED") {
        friendlyError = "Email wajib diisi agar tim CS dapat menghubungi Anda.";
      } else if (emailValidation.error === "DISPOSABLE") {
        friendlyError = "Email sementara / disposable tidak diperbolehkan.";
      } else if (emailValidation.error === "DUMMY") {
        friendlyError = "Harap masukkan alamat email asli yang valid.";
      }

      await logSecurityEvent({
        type: "spam_email",
        title: `Spam/Disposable Email Blocked (${emailValidation.error})`,
        detail: `Rejected input: "${userEmail}" - ${friendlyError}`,
        ip: clientIp,
      });

      return NextResponse.json(
        { error: friendlyError, code: emailValidation.error },
        { status: 400 }
      );
    }

    // 3. Cloudflare Turnstile verification (invisible anti-bot)
    if (TURNSTILE_SECRET && !authUser) {
      if (!turnstileToken) {
        await logSecurityEvent({
          type: "turnstile_fail",
          title: "Turnstile Token Missing",
          detail: `Submission from "${userEmail}" blocked because Turnstile token was missing.`,
          ip: clientIp,
        });
        return NextResponse.json(
          { error: "Verifikasi anti-bot Cloudflare diperlukan.", code: "TURNSTILE_REQUIRED" },
          { status: 400 }
        );
      }

      try {
        const formData = new URLSearchParams();
        formData.append("secret", TURNSTILE_SECRET);
        formData.append("response", turnstileToken);
        if (clientIp) {
          formData.append("remoteip", clientIp);
        }

        const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        const cfData = await cfRes.json().catch(() => ({}));
        if (!cfData.success) {
          console.warn("[CS Support Report] Turnstile verification failed:", cfData["error-codes"]);
          await logSecurityEvent({
            type: "turnstile_fail",
            title: "Cloudflare Turnstile Verification Failed",
            detail: `Challenge rejected for "${userEmail}". Errors: ${JSON.stringify(cfData["error-codes"] || [])}`,
            ip: clientIp,
          });
          return NextResponse.json(
            { error: "Verifikasi keamanan anti-bot gagal. Silakan coba lagi.", code: "TURNSTILE_FAILED" },
            { status: 403 }
          );
        }
      } catch (cfErr) {
        // Fail closed: letting submissions through when siteverify is
        // unreachable means the bot filter is bypassable by blocking Cloudflare.
        console.warn("[CS Support Report] Turnstile siteverify unreachable:", cfErr);
        return NextResponse.json(
          { error: "Verifikasi keamanan tidak tersedia. Silakan coba lagi.", code: "TURNSTILE_UNAVAILABLE" },
          { status: 503 }
        );
      }
    }

    const categoryLabels: Record<string, { label: string; badge: string; color: string }> = {
      bug: { label: "Laporan Bug (Bug Report)", badge: "🐛 BUG", color: "#dc2626" },
      feature: { label: "Request Fitur Baru (New Feature)", badge: "💡 FITUR", color: "#7c3aed" },
      other: { label: "Pertanyaan / Lain-lain (General)", badge: "💬 SUPPORT", color: "#2563eb" },
    };

    const catMeta = categoryLabels[category] || categoryLabels.other;
    const finalSubject = `[${catMeta.badge}] ${subject || "Customer Support Report"}`;

    const mailtoBody = encodeURIComponent(
      `Kategori: ${catMeta.label}\nDari: ${userEmail}\nURL: ${pageUrl}\n\nDetail:\n${message}`
    );
    const mailtoLink = `mailto:${encodeURIComponent(CS_EMAIL)}?subject=${encodeURIComponent(finalSubject)}&body=${mailtoBody}`;

    let emailSent = false;
    let emailError: string | null = null;

    if (RESEND_API_KEY) {
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid ${catMeta.color}; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; color: white; background: ${catMeta.color}; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${catMeta.badge}
            </span>
            <h2 style="margin: 12px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
              ${escapeHtml(subject || catMeta.label)}
            </h2>
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Dikirim dari BugSnap Dashboard CS Form (Anti-Spam & Turnstile Verified)
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              Isi Laporan / Pesan:
            </h3>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #0f172a;">
              ${escapeHtml(message)}
            </div>
          </div>

          <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; line-height: 1.6;">
            <div><strong>Pengirim:</strong> ${escapeHtml(userEmail)}</div>
            ${authUser?.plan ? `<div><strong>Paket User:</strong> ${escapeHtml(authUser.plan)}</div>` : ""}
            ${pageUrl ? `<div><strong>Halaman:</strong> <a href="${escapeHtml(pageUrl)}" style="color: #4f46e5;">${escapeHtml(pageUrl)}</a></div>` : ""}
            ${userAgent ? `<div style="word-break: break-all;"><strong>Browser:</strong> ${escapeHtml(userAgent)}</div>` : ""}
            <div><strong>Waktu:</strong> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</div>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="mailto:${encodeURIComponent(userEmail)}?subject=Re: ${encodeURIComponent(finalSubject)}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
              Balas ke ${escapeHtml(userEmail)}
            </a>
          </div>
        </div>
      `;

      try {
        let resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: [CS_EMAIL],
            reply_to: userEmail,
            subject: finalSubject,
            html,
          }),
        });

        // If custom domain is pending verification, retry once with fallback
        if (!resendRes.ok && RESEND_FROM_EMAIL !== RESEND_FALLBACK_FROM) {
          const firstErr = await resendRes.json().catch(() => ({}));
          console.warn("[CS Support Report] Primary sender unverified, retrying with fallback:", firstErr.message);
          resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: RESEND_FALLBACK_FROM,
              to: [CS_EMAIL],
              reply_to: userEmail,
              subject: finalSubject,
              html,
            }),
          });
        }

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const errData = await resendRes.json().catch(() => ({}));
          emailError = errData.message || `Resend HTTP ${resendRes.status}`;
          console.warn("[CS Support Report] Resend API error:", emailError);
        }
      } catch (err: unknown) {
        emailError = (err as Error)?.message || "Failed to reach Resend API";
        console.warn("[CS Support Report] Dispatch exception:", err);
      }
    }

    // 4. Persist ticket for the Admin Support Inbox. Plain insert: the old
    // read-splice-upsert on one app_settings row dropped tickets filed at the
    // same moment, and the 100-entry cap silently deleted the oldest ones.
    try {
      const db = createServiceClient();
      await db.from("support_tickets").insert({
        id: `tick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        category,
        subject: subject || catMeta.label,
        message,
        user_email: userEmail,
        user_plan: authUser?.plan || "free",
        page_url: pageUrl,
        user_agent: userAgent,
        status: "open", // open | in_progress | resolved
        email_sent: emailSent,
      });
    } catch (saveErr) {
      console.warn("[CS Support Report] Failed to persist ticket:", saveErr);
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      targetEmail: CS_EMAIL,
      mailtoLink,
      note: emailSent
        ? "Laporan berhasil dikirimkan ke email Customer Support."
        : "Laporan tersimpan. Anda juga dapat mengirimkannya via mailto langsung.",
      error: emailError || undefined,
    });
  } catch (err: unknown) {
    console.error("[CS Support Report] Fatal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
