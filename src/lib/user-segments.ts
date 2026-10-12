// Single source of truth for the "hot prospect" / "abandoned checkout" sales
// segments. revenue/route.ts and data/route.ts both used to define these
// inline and had already drifted on the abandoned-cart rule - import these
// instead of re-filtering users by hand.

export interface HotProspectUser {
  plan?: string | null;
  paywall_hits?: number | null;
}

export interface AbandonedCheckoutUser {
  checkout_status?: string | null;
  plan?: string | null;
}

export function isHotProspect(u: HotProspectUser): boolean {
  return (u.plan || "free").toLowerCase() === "free" && (u.paywall_hits || 0) > 0;
}

export function isAbandonedCheckout(u: AbandonedCheckoutUser): boolean {
  return (
    u.checkout_status === "abandoned" ||
    (u.checkout_status === "initiated" && (u.plan || "free").toLowerCase() === "free")
  );
}
