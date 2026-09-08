import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isPlan } from "@/lib/tiers";

export const runtime = "nodejs";

function hasValidSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"));
  return signatures.some((signature) => {
    const actual = Buffer.from(signature);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature || !hasValidSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!event || typeof event !== "object" || !("type" in event)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const supportedEvents = ["checkout.session.completed", "checkout.session.expired"];
  if (!supportedEvents.includes(event.type as string)) {
    return NextResponse.json({ received: true });
  }

  const object = (event as {
    data?: { object?: {
      customer_details?: { email?: unknown };
      customer_email?: unknown;
      metadata?: { plan?: unknown };
    } };
  }).data?.object;
  const rawEmail = object?.customer_details?.email ?? object?.customer_email;
  if (typeof rawEmail !== "string" || !rawEmail.trim() || rawEmail.length > 320) {
    return NextResponse.json({ error: "Checkout session has no valid customer email" }, { status: 400 });
  }

  const email = rawEmail.trim().toLowerCase();
  const supabase = createServiceClient();

  // Tier comes from the checkout session's plan metadata (set at session creation)
  const rawPlan = object?.metadata?.plan;
  const plan = typeof rawPlan === "string" && isPlan(rawPlan) ? rawPlan : "pro";

  try {
    if (event.type === "checkout.session.completed") {
      const { error } = await supabase
        .from("users")
        .update({
          plan,
          checkout_status: "completed",
          last_checkout_plan: plan,
        })
        .eq("email", email);
      if (error) throw error;
    } else if (event.type === "checkout.session.expired") {
      // User abandoned checkout session without paying — hot lead for cart recovery
      // ponytail: zero extra rows, purely a status flag on user record
      await supabase
        .from("users")
        .update({
          checkout_status: "abandoned",
          last_checkout_plan: plan,
        })
        .eq("email", email);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Processing failed", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
