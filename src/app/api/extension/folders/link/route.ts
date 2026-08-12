import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

async function emailFromGoogleToken(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error("Invalid Google token");
  const user = await res.json();
  if (!user.email) throw new Error("Google token has no email");
  return String(user.email).trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { access_token, folder_name, drive_folder_id } = await request.json();
    if (!access_token || !folder_name || !drive_folder_id) {
      return NextResponse.json({ error: "access_token, folder_name, and drive_folder_id are required" }, { status: 400 });
    }
    const email = await emailFromGoogleToken(access_token);
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("link_folder_drive_id", {
      p_email: email,
      p_folder_name: folder_name,
      p_drive_folder_id: drive_folder_id,
    });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Folder link failed" }, { status: 401 });
  }
}
