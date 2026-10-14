import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "promo_banner")
      .maybeSingle();

    const rawPromo = data?.value;
    const promo = rawPromo ? { ...(rawPromo as Record<string, unknown>) } : null;

    if (promo && typeof promo === "object") {
      const exp = (promo.expires_at || promo.expiresAt) as string | undefined;
      if (exp) {
        const expTime = new Date(exp).getTime();
        if (!isNaN(expTime) && expTime < Date.now()) {
          promo.enabled = false;
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        promo,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("Promo fetch error:", err);
    return NextResponse.json({ ok: true, promo: null });
  }
}