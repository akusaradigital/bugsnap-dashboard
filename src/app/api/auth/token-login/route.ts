import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verifiedGoogleEmail } from "@/lib/google-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { access_token?: unknown } | null;
    const access_token = typeof body?.access_token === "string" ? body.access_token : null;
    if (!access_token) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    // 1. Verify the access token with Google AND that it was issued for our own
    // OAuth client. This endpoint mints a login link for the token's email, so
    // accepting a token from any client would be full account takeover.
    let email: string;
    try {
      email = await verifiedGoogleEmail(access_token);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid Google token" },
        { status: 401 }
      );
    }

    // Profile fields are cosmetic; the identity above is the authenticated part.
    const googleUser = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({})) as { name?: string; picture?: string };

    // 2. Initialize Supabase Admin Service Client
    const supabaseAdmin = createServiceClient();

    // 3. Ensure the user exists in Supabase Auth.
    // Create unconditionally and let a duplicate tell us they already exist:
    // that is one request regardless of table size. Paging listUsers 1000 at a
    // time to answer the same question grew with every signup and would have
    // timed out this endpoint long before the auth table got interesting.
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: googleUser.name || email.split("@")[0],
        avatar_url: googleUser.picture || "https://bugsnap.akusaraproject.my.id/icon.svg"
      }
    });

    const alreadyExists =
      createErr?.code === "email_exists" ||
      createErr?.status === 422 ||
      /already.*registered|already exists/i.test(createErr?.message || "");
    if (createErr && !alreadyExists) throw createErr;

    // Existing auth users may predate provisioning triggers. Repair their
    // public profile/workspace before returning a login link. It returns the
    // user id, which is where the invite upsert below now gets it from.
    const { data: provision, error: provisionError } = await supabaseAdmin
      .rpc("ensure_user_and_workspace_by_email", { p_email: email })
      .maybeSingle<{ user_id: string; workspace_id: string }>();
    if (provisionError) throw provisionError;
    const userId = provision?.user_id;

    // 3.5. Accept pending workspace invites for this user's email
    const emailNorm = email.toLowerCase().trim();
    const { data: invites, error: invitesErr } = await supabaseAdmin
      .from("workspace_invites")
      .select("workspace_id, role")
      .eq("email", emailNorm)
      .is("accepted_at", null);

    if (!invitesErr && invites && invites.length > 0 && userId) {
      const memberRows = invites.map((inv) => ({
        workspace_id: inv.workspace_id,
        user_id: userId,
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
    // Log the detail, return a generic message: this is an unauthenticated
    // auth endpoint and the raw error can name internal tables and config.
    console.error("Token login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
