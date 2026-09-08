import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BugSnap CS <support@bugsnap.akusaraproject.my.id>";
const RESEND_FALLBACK_FROM = "BugSnap CS <onboarding@resend.dev>";

export interface SupportTicket {
  id: string;
  category: "bug" | "feature" | "other";
  subject: string;
  message: string;
  userEmail: string;
  userPlan?: string;
  pageUrl?: string;
  userAgent?: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  emailSent?: boolean;
  replies?: Array<{
    id: string;
    sender: string;
    message: string;
    created_at: string;
  }>;
}

// The table is snake_case; the admin UI has always consumed camelCase, so the
// response shape stays exactly as it was and the mapping lives here.
interface TicketRow {
  id: string;
  category: SupportTicket["category"];
  subject: string;
  message: string;
  user_email: string;
  user_plan: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: SupportTicket["status"];
  email_sent: boolean;
  replies: SupportTicket["replies"];
  created_at: string;
}

const TICKET_COLUMNS =
  "id, category, subject, message, user_email, user_plan, page_url, user_agent, status, email_sent, replies, created_at";

function toTicket(r: TicketRow): SupportTicket {
  return {
    id: r.id,
    category: r.category,
    subject: r.subject,
    message: r.message,
    userEmail: r.user_email,
    userPlan: r.user_plan ?? undefined,
    pageUrl: r.page_url ?? undefined,
    userAgent: r.user_agent ?? undefined,
    status: r.status,
    created_at: r.created_at,
    emailSent: r.email_sent,
    replies: r.replies ?? [],
  };
}

// GET /api/admin/support - List all support tickets
export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const db = createServiceClient();
    const { data } = await db
      .from("support_tickets")
      .select(TICKET_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(500);

    const tickets: SupportTicket[] = ((data ?? []) as unknown as TicketRow[]).map(toTicket);

    // Counted over the whole table, not the page above, so the totals stay
    // right once history outgrows the 500-row limit.
    const countByStatus = async (status: string) =>
      (await db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;

    const [total, open, in_progress, resolved] = await Promise.all([
      db.from("support_tickets").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
      countByStatus("open"),
      countByStatus("in_progress"),
      countByStatus("resolved"),
    ]);
    const stats = { total, open, in_progress, resolved };

    return NextResponse.json({ ok: true, stats, tickets });
  } catch (err) {
    console.error("[Admin Support API] GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/admin/support - Update ticket status
export async function PATCH(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const ticketId = String(body?.ticketId || "").trim();
    const newStatus = String(body?.status || "").trim();

    if (!ticketId || !["open", "in_progress", "resolved"].includes(newStatus)) {
      return NextResponse.json({ error: "Parameter ticketId dan status valid diperlukan" }, { status: 400 });
    }

    const db = createServiceClient();
    // Targeted update: no longer rewrites every other ticket to change one.
    const { data } = await db
      .from("support_tickets")
      .update({ status: newStatus })
      .eq("id", ticketId)
      .select(TICKET_COLUMNS)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ticket: toTicket(data as unknown as TicketRow) });
  } catch (err) {
    console.error("[Admin Support API] PATCH Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/support - Reply to ticket via Resend email
export async function POST(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const ticketId = String(body?.ticketId || "").trim();
    const replyMessage = String(body?.replyMessage || "").trim();

    if (!ticketId || !replyMessage) {
      return NextResponse.json({ error: "Ticket ID dan pesan balasan wajib diisi" }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: row } = await db
      .from("support_tickets")
      .select(TICKET_COLUMNS)
      .eq("id", ticketId)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    const ticket = toTicket(row as unknown as TicketRow);

    // Send email via Resend if API key is present
    let sentEmail = false;
    if (RESEND_API_KEY && ticket.userEmail) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 18px;">Tanggapan Customer Support BugSnap</h2>
            <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Mengenai: ${ticket.subject}</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px; white-space: pre-wrap; margin-bottom: 20px;">
            ${replyMessage}
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8;">
            Pesan ini dikirim oleh tim BugSnap Support sebagai tindak lanjut atas laporan Anda.
          </p>
        </div>
      `;

      try {
        let res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: [ticket.userEmail],
            subject: `Re: ${ticket.subject}`,
            html: emailHtml,
          }),
        });

        if (!res.ok && RESEND_FROM_EMAIL !== RESEND_FALLBACK_FROM) {
          res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: RESEND_FALLBACK_FROM,
              to: [ticket.userEmail],
              subject: `Re: ${ticket.subject}`,
              html: emailHtml,
            }),
          });
        }
        sentEmail = res.ok;
      } catch (mailErr) {
        console.warn("[Admin Support API] Resend dispatch error:", mailErr);
      }
    }

    // Append reply to ticket
    const newReply = {
      id: `rep_${Date.now()}`,
      sender: "BugSnap Support",
      message: replyMessage,
      created_at: new Date().toISOString(),
    };

    // ponytail: read-modify-write on this one ticket's replies array. Two
    // admins replying to the SAME ticket in the same second could still lose
    // one; move to a jsonb append RPC if that ever happens.
    await db
      .from("support_tickets")
      .update({ replies: [...(ticket.replies || []), newReply], status: "in_progress" })
      .eq("id", ticketId);

    return NextResponse.json({ ok: true, emailSent: sentEmail, reply: newReply });
  } catch (err) {
    console.error("[Admin Support API] POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
