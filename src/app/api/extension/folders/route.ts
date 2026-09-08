import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verifiedGoogleEmail } from "@/lib/google-token";

export const runtime = "nodejs";

const emailFromGoogleToken = verifiedGoogleEmail;

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
