import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { renderCommentEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !body.comment) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { comment } = body;
    const { capture_id, author_name, body: commentBody, id: commentId } =
      comment as { capture_id?: unknown; author_name?: unknown; body?: string; id?: string };

    if (!capture_id || typeof commentBody !== "string" || typeof commentId !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Only a comment that actually exists in the DB, on this capture, with a
    // matching body, and created just now may trigger emails. Without this
    // check any anonymous caller who knows a capture id (share URLs are
    // public) could email-bomb the workspace owner / members with fabricated
    // comments and @mentions. post_comment's rate limit still governs posting.
    const { data: saved, error: savedError } = await supabase
      .from("comments")
      .select("id, capture_id, body, created_at")
      .eq("id", commentId)
      .eq("capture_id", capture_id)
      .maybeSingle();
    if (savedError || !saved) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    const commentAgeMs = Date.now() - new Date(saved.created_at).getTime();
    if (saved.body !== commentBody || commentAgeMs < 0 || commentAgeMs > 5 * 60_000) {
      return NextResponse.json({ error: "Comment is stale or body mismatch" }, { status: 400 });
    }

    // 1. Get capture to know workspace_id and title
    const { data: capture, error: captureError } = await supabase
      .from("captures")
      .select("title, workspace_id, user_id")
      .eq("id", capture_id)
      .single();

    if (captureError || !capture) {
      console.error("Failed to fetch capture:", captureError);
      return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    // 2. Get workspace to resolve owner_user_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("owner_user_id, name")
      .eq("id", capture.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.error("Failed to fetch workspace:", workspaceError);
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 3. Resolve owner's email address
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("email, id, notification_prefs")
      .eq("id", workspace.owner_user_id)
      .single();

    if (ownerError || !owner || !owner.email) {
      console.error("Failed to fetch owner email:", ownerError);
      return NextResponse.json({ error: "Owner email not found" }, { status: 404 });
    }

    // 4. Parse @mentions from the comment body and resolve workspace members
    const mentionedTokens = (commentBody.match(/@([a-zA-Z0-9_.-]+)/g) || []).map((m: string) => m.slice(1).toLowerCase());
    const mentionEmails = new Set<string>();

    if (mentionedTokens.length > 0) {
      const { data: members } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", capture.workspace_id);

      const memberUserIds = (members?.map((m) => m.user_id) ?? []).filter(Boolean);
      if (memberUserIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("email, full_name, notification_prefs")
          .in("id", memberUserIds);

        const commenterEmail = comment.author_email ? comment.author_email.toLowerCase() : "";
        if (users) {
          for (const u of users) {
            const uEmail = (u.email || "").toLowerCase();
            if (!uEmail || uEmail === commenterEmail) continue;
            if (u.notification_prefs?.mention === false) continue;
            const emailPrefix = uEmail.split("@")[0];
            const nameTokens = (u.full_name || "").toLowerCase().split(/\s+/).filter(Boolean);
            const isMentioned = mentionedTokens.some(
              (t: string) => uEmail === t || emailPrefix === t || nameTokens.includes(t)
            );
            if (isMentioned) mentionEmails.add(u.email);
          }
        }
      }
    }

    const ownerEmailLower = owner.email.toLowerCase();
    const commenterEmail = comment.author_email ? comment.author_email.toLowerCase() : "";
    const skipOwner = commenterEmail === ownerEmailLower || mentionEmails.has(owner.email) || mentionEmails.has(ownerEmailLower) || owner.notification_prefs?.comment === false;

    // 5. Send emails via Resend API
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, dryRun: true, message: "RESEND_API_KEY not configured" });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";
    const captureUrl = `${appUrl}/v/${capture_id}`;
    const mailFrom = process.env.RESEND_FROM_EMAIL || "BugSnap <no-reply@bugsnap.akusaraproject.my.id>";

    const sendResend = async (to: string, subject: string, html: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from: mailFrom, to: [to], subject, html }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend failed with status ${response.status}: ${errText}`);
      }
    };

    // Mentioned users each get a professional "you were mentioned" notification email
    for (const email of Array.from(mentionEmails)) {
      const emailContent = renderCommentEmail({
        appUrl,
        captureTitle: capture.title || "Untitled",
        captureUrl,
        workspaceName: workspace.name,
        authorName: String(author_name || "A collaborator"),
        commentBody,
        isMention: true,
      });
      await sendResend(email, emailContent.subject, emailContent.html);
    }

    // Owner gets the standard "New Comment" email unless they are the author or already mentioned
    if (!skipOwner) {
      const emailContent = renderCommentEmail({
        appUrl,
        captureTitle: capture.title || "Untitled",
        captureUrl,
        workspaceName: workspace.name,
        authorName: String(author_name || "A collaborator"),
        commentBody,
        isMention: false,
      });
      await sendResend(owner.email, emailContent.subject, emailContent.html);
    }

    // ponytail: no `mentions` in the response - it leaked member emails to any
    // anonymous caller (enumeration + spam vector) and the client never
    // consumes it (Comments.tsx). Emails are still resolved server-side for
    // the Resend notifications; the response carries only ok/sent.
    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("Failed to send comment notification email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
