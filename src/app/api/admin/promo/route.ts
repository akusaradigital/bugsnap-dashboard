import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { authorized, callerEmail, supabase } = await checkAdminAuth(req);

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
    const enabled = Boolean(body.enabled);

    // Validate discount percentage (if provided: must be between 1 and 100)
    const discountVal = body.discount_percent ?? body.discount_percentage ?? body.discount;
    let discountPercent: number | undefined;
    if (discountVal !== undefined && discountVal !== null && discountVal !== "") {
      const parsed = Number(discountVal);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
        return NextResponse.json({ error: "Discount percentage must be between 1 and 100" }, { status: 400 });
      }
      discountPercent = parsed;
    }

    // Validate max_uses (if provided: positive integer)
    const maxUsesVal = body.max_uses ?? body.maxUses;
    let maxUses: number | undefined;
    if (maxUsesVal !== undefined && maxUsesVal !== null && maxUsesVal !== "") {
      const parsed = Number(maxUsesVal);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json({ error: "Max uses must be a positive integer" }, { status: 400 });
      }
      maxUses = parsed;
    }

    // Validate expiry date (if provided: valid date)
    const expiryVal = body.expires_at ?? body.expiry_date ?? body.expiresAt ?? body.expiryDate;
    let expiresAt: string | undefined;
    if (expiryVal !== undefined && expiryVal !== null && expiryVal !== "") {
      const parsed = new Date(String(expiryVal));
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
      }
      expiresAt = parsed.toISOString();
    }

    const promoValue: Record<string, unknown> = {
      message,
      enabled,
      ...(discountPercent !== undefined && { discount_percent: discountPercent }),
      ...(maxUses !== undefined && { max_uses: maxUses }),
      ...(expiresAt !== undefined && { expires_at: expiresAt }),
    };

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "promo_banner", value: promoValue, updated_at: new Date().toISOString() });

    if (error) throw error;

    await logSecurityEvent({
      type: "admin_action",
      title: enabled ? "Promo Banner Enabled" : "Promo Banner Disabled",
      detail: `Admin ${callerEmail || "Console"} ${enabled ? "enabled" : "disabled"} the promo banner${message ? `: "${message}"` : ""}`,
    });

    return NextResponse.json({ ok: true, promo: promoValue });
  } catch (err) {
    console.error("Admin promo update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
