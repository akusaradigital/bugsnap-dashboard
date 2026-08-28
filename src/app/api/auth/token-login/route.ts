import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import type { User } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    // 1. Verify access token with Google to get the user's email securely
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      return NextResponse.json({ error: `Invalid Google token: ${errText}` }, { status: 401 });
    }

    const googleUser = await googleRes.json() as { email?: string; email_verified?: boolean; name?: string; picture?: string };
    const email = googleUser.email?.trim().toLowerCase();
    if (!email || googleUser.email_verified !== true) {
      return NextResponse.json({ error: "A verified Google email is required" }, { status: 401 });
    }

    // 2. Initialize Supabase Admin Service Client
    const supabaseAdmin = createServiceClient();

    // 3. Ensure user exists in Supabase Auth
    let page = 1;
    let targetUser: User | null = null;

    while (!targetUser) {
      const { data: userSearch, error: searchErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000
      });
      if (searchErr) throw searchErr;

      targetUser = userSearch.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (!userSearch.users.length || userSearch.users.length < 1000 || targetUser) break;
      page++;
    }

    if (!targetUser) {
      // Create user if they don't exist yet (auto-confirmed). The auth trigger
      // creates public.users + default workspace atomically.
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: googleUser.name || email.split("@")[0],
          avatar_url: googleUser.picture || "https://bugsnap.akusaraproject.my.id/icon.svg"
        }
      });

      if (createErr) throw createErr;
      targetUser = newUser.user;
    }

    // Existing auth users may predate provisioning triggers. Repair their
    // public profile/workspace before returning a login link.
    const { error: provisionError } = await supabaseAdmin.rpc("ensure_user_and_workspace_by_email", { p_email: email });
    if (provisionError) throw provisionError;

    // 3.5. Accept pending workspace invites for this user's email
    const emailNorm = email.toLowerCase().trim();
    const { data: invites, error: invitesErr } = await supabaseAdmin
      .from("workspace_invites")
      .select("workspace_id, role")
      .eq("email", emailNorm)
      .is("accepted_at", null);

    if (!invitesErr && invites && invites.length > 0) {
      const memberRows = invites.map((inv) => ({
        workspace_id: inv.workspace_id,
        user_id: targetUser.id,
        role: inv.role || "member",
        joined_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from("workspace_members").upsert(memberRows, { onConflict: "workspace_id,user_id" });

      await supabaseAdmin
        .from("workspace_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("email", emailNorm)
        .is("accepted_at", null);
    }

    // 4. Generate a one-time login link (magic link) for this email
    const origin = new URL(request.url).origin;
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${origin}/dashboard`
      }
    });

    if (linkErr) throw linkErr;

    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      throw new Error("Failed to generate action link from Supabase");
    }

    // Return the action link to the client for redirect
    return NextResponse.json({ success: true, actionLink });
  } catch (err) {
    console.error("Token login error:", err);
    const errMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
