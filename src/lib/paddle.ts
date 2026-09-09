// Client-side helper for Paddle Billing (v2) Checkout
// Lazy-loads paddle.js only when checkout is opened.

import { normalizePlan, type Plan } from "@/lib/tiers";

export interface PaddleCheckoutOptions {
  priceId?: string;
  plan?: string;
  isYearly?: boolean;
  userEmail?: string;
  userId?: string;
  discountCode?: string;
  successUrl?: string;
}

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: "sandbox" | "production") => void;
      };
      Initialize: (options: {
        token: string;
        eventCallback?: (event: unknown) => void;
      }) => void;
      Checkout: {
        open: (options: {
          items?: Array<{ priceId: string; quantity: number }>;
          transactionId?: string;
          customer?: { email?: string };
          customData?: Record<string, unknown>;
          discountCode?: string;
          settings?: {
            displayMode?: "overlay" | "inline";
            theme?: "light" | "dark";
            locale?: string;
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}

let paddlePromise: Promise<boolean> | null = null;
let paddleInitialized = false;

/**
 * Lazy loads Paddle.js v2 once.
 */
export function loadPaddle(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (paddleInitialized && window.Paddle) return Promise.resolve(true);
  if (paddlePromise) return paddlePromise;

  paddlePromise = new Promise<boolean>((resolve) => {
    if (window.Paddle) {
      initPaddle();
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="paddle.com/paddle/v2/paddle.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        initPaddle();
        resolve(true);
      });
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      initPaddle();
      resolve(true);
    };
    script.onerror = () => {
      console.warn("[Paddle] Failed to load Paddle.js");
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return paddlePromise;
}

function initPaddle() {
  if (!window.Paddle || paddleInitialized) return;
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    console.warn("[Paddle] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set.");
    return;
  }

  const env = process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";
  window.Paddle.Environment.set(env);
  window.Paddle.Initialize({
    token,
  });
  paddleInitialized = true;
}

/**
 * Resolves Paddle Price ID from environment variables based on plan and billing cycle.
 */
export function getPaddlePriceId(plan: string = "pro", isYearly: boolean = true): string {
  const normPlan = plan.toLowerCase();
  if (normPlan === "pro" || normPlan === "team") {
    return isYearly
      ? process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID || ""
      : process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID || "";
  }
  if (normPlan === "pro_plus") {
    return isYearly
      ? process.env.NEXT_PUBLIC_PADDLE_PRO_PLUS_YEARLY_PRICE_ID || ""
      : process.env.NEXT_PUBLIC_PADDLE_PRO_PLUS_MONTHLY_PRICE_ID || "";
  }
  return "";
}

/**
 * Resolves one-time add-on Price IDs (Top-ups)
 */
export function getAddonPriceId(addon: "ai_summaries" | "captures_pack"): string {
  if (addon === "ai_summaries") {
    return process.env.NEXT_PUBLIC_PADDLE_ADDON_AI_PRICE_ID || "";
  }
  if (addon === "captures_pack") {
    return process.env.NEXT_PUBLIC_PADDLE_ADDON_CAPTURES_PRICE_ID || "";
  }
  return "";
}

/**
 * Opens the Paddle checkout overlay.
 * Returns true if checkout opened, false if unconfigured (caller can fallback to pricing/contact).
 */
export async function openPaddleCheckout(opts: PaddleCheckoutOptions): Promise<boolean> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const priceId = opts.priceId || getPaddlePriceId(opts.plan, opts.isYearly);

  // If Paddle credentials are not configured yet, notify caller to handle fallback
  if (!token || !priceId) {
    console.info("[Paddle] Checkout not configured yet. Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and Price IDs.");
    return false;
  }

  const loaded = await loadPaddle();
  if (!loaded || !window.Paddle) return false;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: opts.userEmail ? { email: opts.userEmail } : undefined,
    discountCode: opts.discountCode?.trim() || undefined,
    customData: {
      user_id: opts.userId,
      user_email: opts.userEmail,
      plan: opts.plan || "pro",
      billing: opts.isYearly ? "yearly" : "monthly",
    },
    settings: {
      displayMode: "overlay",
      theme: "light",
      successUrl: opts.successUrl || `${currentOrigin}/dashboard?upgraded=true`,
    },
  });

  return true;
}

/**
 * Directs user to Paddle Customer Portal for invoice downloads & payment method update.
 */
export function openPaddleCustomerPortal(portalUrl?: string) {
  const target = portalUrl || process.env.NEXT_PUBLIC_PADDLE_PORTAL_URL || "https://billing.paddle.com";
  window.open(target, "_blank", "noopener,noreferrer");
}

/**
 * Reverse Free Trial:
 * New users get 7 days of Pro features automatically without credit card upfront.
 */
export function getEffectivePlan(plan?: string | null, userCreatedAt?: string | null): {
  plan: Plan;
  isTrial: boolean;
  trialDaysLeft: number;
} {
  const norm = normalizePlan(plan);
  if (norm !== "free") {
    return { plan: norm, isTrial: false, trialDaysLeft: 0 };
  }
  if (!userCreatedAt) {
    return { plan: "free", isTrial: false, trialDaysLeft: 0 };
  }

  const created = new Date(userCreatedAt).getTime();
  if (isNaN(created)) {
    return { plan: "free", isTrial: false, trialDaysLeft: 0 };
  }

  const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - created;

  if (elapsed >= 0 && elapsed < trialDurationMs) {
    const daysLeft = Math.max(1, Math.ceil((trialDurationMs - elapsed) / (24 * 60 * 60 * 1000)));
    return { plan: "pro", isTrial: true, trialDaysLeft: daysLeft };
  }

  return { plan: "free", isTrial: false, trialDaysLeft: 0 };
}
