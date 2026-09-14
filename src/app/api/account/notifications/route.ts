import { NextResponse } from "next/server";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

export type NotificationPrefs = {
  comment: boolean;
  mention: boolean;
  digest: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  comment: true,
  mention: true,
  digest: true,
};

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: userRow, error } = await db
    .from("users")
    .select("notification_prefs")
    .or(`id.eq.${user.id},email.ilike.${user.email}`)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch notification prefs:", error);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }

  const raw = (userRow?.notification_prefs && typeof userRow.notification_prefs === "object")
    ? (userRow.notification_prefs as Record<string, unknown>)
    : null;

  const prefs: NotificationPrefs = {
    comment: typeof raw?.comment === "boolean" ? raw.comment : DEFAULT_PREFS.comment,
    mention: typeof raw?.mention === "boolean" ? raw.mention : DEFAULT_PREFS.mention,
    digest: typeof raw?.digest === "boolean" ? raw.digest : DEFAULT_PREFS.digest,
  };

  return NextResponse.json({ notification_prefs: prefs });
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = createServiceClient();

  const { data: userRow, error: selectError } = await db
    .from("users")
    .select("id, notification_prefs")
    .or(`id.eq.${user.id},email.ilike.${user.email}`)
    .maybeSingle();

  if (selectError) {
    console.error("Failed to query user for notification prefs:", selectError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const current = (userRow?.notification_prefs && typeof userRow.notification_prefs === "object")
    ? (userRow.notification_prefs as Record<string, unknown>)
    : DEFAULT_PREFS;

  const nextPrefs: NotificationPrefs = {
    comment: typeof body.comment === "boolean" ? body.comment : (typeof current.comment === "boolean" ? current.comment : true),
    mention: typeof body.mention === "boolean" ? body.mention : (typeof current.mention === "boolean" ? current.mention : true),
    digest: typeof body.digest === "boolean" ? body.digest : (typeof current.digest === "boolean" ? current.digest : true),
  };

  const targetId = userRow?.id || user.id;

  const { error: updateError } = await db
    .from("users")
    .update({
      notification_prefs: nextPrefs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  if (updateError) {
    console.error("Failed to update notification prefs:", updateError);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  return NextResponse.json({ success: true, notification_prefs: nextPrefs });
}
