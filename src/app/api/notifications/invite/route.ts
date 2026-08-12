import { NextResponse } from "next/server";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const EXTENSION_URL = "https://chromewebstore.google.com/detail/jfhbmdllebgpmceeoffkfhlhdchhbcg";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] || ch));
}

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

  const workspaceName = escapeHtml(String(workspace.name || "BugSnap"));
  const inviter = escapeHtml(user.email);
  const loginUrl = `${appUrl.replace(/\/$/, "")}/login`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
      <h2 style="margin:0 0 12px;font-size:22px">You're invited to BugSnap</h2>
      <p style="font-size:14px;line-height:1.6;color:#4b5563">${inviter} invited you to join <strong>${workspaceName}</strong>.</p>
      <p style="font-size:14px;line-height:1.6;color:#4b5563">Sign up or log in with this email, then install the Chrome extension to start capturing bugs into the workspace.</p>
      <p style="margin:24px 0">
        <a href="${loginUrl}" style="display:inline-block;margin-right:8px;padding:10px 14px;border-radius:8px;background:#4f46e5;color:white;text-decoration:none;font-weight:700">Join workspace</a>
        <a href="${EXTENSION_URL}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#eef2ff;color:#4338ca;text-decoration:none;font-weight:700">Download extension</a>
      </p>
      <p style="font-size:12px;color:#6b7280">If you did not expect this invite, you can ignore this email.</p>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: [targetEmail],
      subject: `Join ${workspace.name} on BugSnap`,
      html,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Invite email failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
