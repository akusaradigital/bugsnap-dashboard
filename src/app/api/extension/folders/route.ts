import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

async function emailFromGoogleToken(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Invalid Google token");
  const user = await res.json();
  if (!user.email) throw new Error("Google token has no email");
  return String(user.email).trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();
    if (!access_token) return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    const email = await emailFromGoogleToken(access_token);
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_folders_by_email", { p_email: email });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Folder sync failed" }, { status: 401 });
  }
}
