import { NextResponse } from "next/server";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";
import { renderWorkspaceInviteEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

const EXTENSION_URL = "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, workspaceId } = await req.json().catch(() => ({}));
  const targetEmail = String(email || "").trim().toLowerCase();
  const wsId = String(workspaceId || "").trim();
  if (!targetEmail || !wsId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", wsId)
    .maybeSingle();
  if (wsError || !workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", wsId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";
  const from = process.env.RESEND_FROM_EMAIL || "BugSnap <no-reply@bugsnap.akusaraproject.my.id>";
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, dryRun: true });

  const workspaceName = String(workspace.name || "BugSnap");
  const loginUrl = `${appUrl.replace(/\/$/, "")}/login`;

  const emailContent = renderWorkspaceInviteEmail({
    appUrl,
    workspaceName,
    inviterEmail: user.email,
    loginUrl,
    extensionUrl: EXTENSION_URL,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: [targetEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Invite email failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
