import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export interface UninstallFeedbackEntry {
  id: string;
  message: string;
  userEmail: string | null;
  extensionVersion: string | null;
  browser: string | null;
  os: string | null;
  locale: string | null;
  created_at: string;
}

interface FeedbackRow {
  id: string;
  message: string;
  user_email: string | null;
  extension_version: string | null;
  browser: string | null;
  os: string | null;
  locale: string | null;
  created_at: string;
}

const COLUMNS = "id, message, user_email, extension_version, browser, os, locale, created_at";

function toEntry(r: FeedbackRow): UninstallFeedbackEntry {
  return {
    id: r.id,
    message: r.message,
    userEmail: r.user_email,
    extensionVersion: r.extension_version,
    browser: r.browser,
    os: r.os,
    locale: r.locale,
    created_at: r.created_at,
  };
}

// GET /api/admin/uninstall-feedback - List all uninstall feedback entries
export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const db = createServiceClient();
    const { data } = await db
      .from("uninstall_feedback")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(500);

    const entries: UninstallFeedbackEntry[] = ((data ?? []) as unknown as FeedbackRow[]).map(toEntry);
    const { count: total } = await db
      .from("uninstall_feedback")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({ entries, total: total ?? entries.length });
  } catch (err: unknown) {
    console.error("[Admin Uninstall Feedback] Fatal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
