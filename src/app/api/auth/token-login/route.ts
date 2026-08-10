import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

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

    const googleUser = await googleRes.json();
    const email = googleUser.email;
    if (!email) {
      return NextResponse.json({ error: "Email not returned by Google" }, { status: 400 });
    }

    // 2. Initialize Supabase Admin Service Client
    const supabaseAdmin = createServiceClient();

    // 3. Ensure user exists in Supabase Auth
    const { data: userSearch, error: searchErr } = await supabaseAdmin.auth.admin.listUsers();
    if (searchErr) throw searchErr;

    let targetUser = userSearch.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      // Create user if they don't exist yet (auto-confirmed)
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: googleUser.name || email.split("@")[0],
          avatar_url: googleUser.picture || ""
        }
      });

      if (createErr) throw createErr;
      targetUser = newUser.user;
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
