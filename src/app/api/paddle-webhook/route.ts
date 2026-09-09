import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isPlan, type Plan } from "@/lib/tiers";

export const runtime = "nodejs";

/**
 * Verifies Paddle Billing (v2) webhook signature:
 * Header: Paddle-Signature: ts=1671552777;h1=eb387f5d...
 * Signature: HMAC-SHA256 of `${ts}:${rawBody}`
 */
function verifyPaddleSignature(payload: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader || !secret) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) {
      parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  }

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1 || !/^\d+$/.test(ts)) return false;

  // Reject webhooks older than 5 minutes to prevent replay attacks
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const expectedHex = createHmac("sha256", secret).update(`${ts}:${payload}`).digest("hex");
  const expected = Buffer.from(expectedHex);
  const actual = Buffer.from(h1);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

interface PaddleWebhookEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string;
    custom_data?: {
      user_id?: string;
      user_email?: string;
      plan?: string;
      [key: string]: unknown;
    } | null;
    customer?: {
      email?: string;
      id?: string;
    };
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Paddle webhook is not configured" }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get("paddle-signature");

  if (!signature || !verifyPaddleSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid Paddle signature" }, { status: 400 });
  }

  let event: PaddleWebhookEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type;
  if (!eventType) {
    return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
  }

  const handledEvents = [
    "transaction.completed",
    "subscription.activated",
    "subscription.created",
    "subscription.updated",
    "subscription.canceled",
    "subscription.paused",
    "subscription.resumed",
    "subscription.past_due",
  ];

  if (!handledEvents.includes(eventType)) {
    return NextResponse.json({ received: true });
  }

  const data = event.data;
  const customData = data?.custom_data;
  const userId = customData?.user_id;
  const emailCandidate = (customData?.user_email || data?.customer?.email || "")
    .trim()
    .toLowerCase();

  if (!userId && !emailCandidate) {
    return NextResponse.json({ error: "No user identifier found in webhook" }, { status: 400 });
  }

  const rawPlan = customData?.plan;
  const plan: Plan = typeof rawPlan === "string" && isPlan(rawPlan) ? rawPlan : "pro";

  const supabase = createServiceClient();

  try {
    if (
      eventType === "transaction.completed" ||
      eventType === "subscription.activated" ||
      eventType === "subscription.created" ||
      eventType === "subscription.resumed"
    ) {
      // User completed payment or activated/resumed subscription -> grant plan
      let query = supabase.from("users").update({
        plan,
        checkout_status: "completed",
        last_checkout_plan: plan,
      });

      if (userId) {
        query = query.eq("id", userId);
      } else {
        query = query.ilike("email", emailCandidate);
      }

      const { error } = await query;
      if (error) throw error;
    } else if (eventType === "subscription.canceled") {
      // Subscription ended -> revert to free
      let query = supabase.from("users").update({
        plan: "free",
        checkout_status: "canceled",
      });

      if (userId) {
        query = query.eq("id", userId);
      } else {
        query = query.ilike("email", emailCandidate);
      }

      const { error } = await query;
      if (error) throw error;
    } else if (eventType === "subscription.paused") {
      // User paused subscription -> temporary retention
      let query = supabase.from("users").update({
        plan: "free",
        checkout_status: "paused",
      });

      if (userId) {
        query = query.eq("id", userId);
      } else {
        query = query.ilike("email", emailCandidate);
      }

      const { error } = await query;
      if (error) throw error;
    } else if (eventType === "subscription.past_due") {
      // Payment failure / grace period (Smart Dunning)
      // ponytail: keep tier active during grace period, only update checkout_status
      let query = supabase.from("users").update({
        checkout_status: "past_due",
      });

      if (userId) {
        query = query.eq("id", userId);
      } else {
        query = query.ilike("email", emailCandidate);
      }

      const { error } = await query;
      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paddle Webhook] Failed to update user plan:", err);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }
}
