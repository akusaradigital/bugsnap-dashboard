import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const getAdminEmails = () =>
  (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function POST(req: Request) {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  let authorized = isAdminAuthenticated;

  const supabase = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.email) {
      if (getAdminEmails().includes(user.email.toLowerCase())) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const subject = body?.subject?.trim();
    const rawContent = (body?.html || body?.body || "").trim();

    if (!subject || !rawContent) {
      return NextResponse.json({ error: "Subject and message body are required" }, { status: 400 });
    }

    const htmlBody = rawContent.startsWith("<")
      ? rawContent
      : `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
          <div style="font-size: 16px; margin-bottom: 24px;">${rawContent.replace(/\n/g, "<br/>")}</div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim oleh tim BugSnap.</p>
        </div>`;

    // Fetch all active user emails
    const { data: users, error: usersErr } = await supabase.from("users").select("email").is("suspended", false);
    if (usersErr) throw usersErr;

    const emails = Array.from(new Set((users || []).map((u) => u.email).filter(Boolean)));
    if (emails.length === 0) {
      return NextResponse.json({ ok: true, sentCount: 0 });
    }

    const mailFrom = process.env.RESEND_FROM_EMAIL || "BugSnap <contact.akusaraproject@gmail.com>";

    const chunkSize = 10;
    let sentCount = 0;

    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);

      const promises = chunk.map(async (email) => {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: mailFrom,
            to: [email],
            subject: subject,
            html: htmlBody,
          }),
        });
        if (response.ok) sentCount++;
      });

      await Promise.allSettled(promises);
      if (i + chunkSize < emails.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return NextResponse.json({ ok: true, sentCount });
  } catch (err) {
    console.error("Admin broadcast error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
