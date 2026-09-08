import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const DEFAULT_CONFIG = {
  minVersion: "1.0.24",
  latestVersion: "1.0.24",
  forceUpdate: false,
  updateUrl: "https://chromewebstore.google.com",
  maintenanceMode: false,
  announcement: "",
};

export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const db = createServiceClient();
    // extension_config stays in app_settings — that one is config, not a log.
    const [{ data: configRow }, { data: errorRows }] = await Promise.all([
      db.from("app_settings").select("value").eq("key", "extension_config").maybeSingle(),
      db
        .from("extension_error_logs")
        .select("id, title, message, details, email, version, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const config = { ...DEFAULT_CONFIG, ...(configRow?.value || {}) };
    const errors = errorRows ?? [];

    return NextResponse.json({ ok: true, config, errors });
  } catch (err) {
    console.error("[Admin Extension API] GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const newConfig = {
      minVersion: String(body.minVersion || DEFAULT_CONFIG.minVersion).trim(),
      latestVersion: String(body.latestVersion || DEFAULT_CONFIG.latestVersion).trim(),
      forceUpdate: Boolean(body.forceUpdate),
      updateUrl: String(body.updateUrl || DEFAULT_CONFIG.updateUrl).trim(),
      maintenanceMode: Boolean(body.maintenanceMode),
      announcement: String(body.announcement || "").trim(),
    };

    const db = createServiceClient();
    await db.from("app_settings").upsert({
      key: "extension_config",
      value: newConfig,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, config: newConfig });
  } catch (err) {
    console.error("[Admin Extension API] POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
