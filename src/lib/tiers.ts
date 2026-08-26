// Tier model for BugSnap. `users.public.plan` is the single source of truth
// (written by the Stripe webhook / manual grant). Dashboard code imports this
// to gate features. Nothing here reads the DB.

export const PLAN_FREE = "free" as const;
export const PLAN_PRO = "pro" as const;
export const PLAN_PRO_PLUS = "pro_plus" as const;
export const PLAN_ENTERPRISE = "enterprise" as const;

export type Plan = typeof PLAN_FREE | typeof PLAN_PRO | typeof PLAN_PRO_PLUS | typeof PLAN_ENTERPRISE;

export const isPlan = (p: unknown): p is Plan =>
  p === PLAN_FREE || p === PLAN_PRO || p === PLAN_PRO_PLUS || p === PLAN_ENTERPRISE;

/** Intended growth order of the tiers (rank of "at least"). */
const RANK: Record<Plan, number> = {
  [PLAN_FREE]: 0,
  [PLAN_PRO]: 1,
  [PLAN_PRO_PLUS]: 2,
  [PLAN_ENTERPRISE]: 3,
};

export const normalizePlan = (p: unknown): Plan => (isPlan(p) ? p : PLAN_FREE);

/** true when the plan is at or above `min`. */
export const planAtLeast = (plan: Plan, min: Plan): boolean => RANK[normalizePlan(plan)] >= RANK[min];

/** Free limit: captures *created* per rolling week (inserts only — edits free). */
export const FREE_WEEKLY_CAPTURES = 5;
/** Free workspace seats (1 owner + up to this many additional members). */
export const FREE_SEATS = 4;

// Feature entitlements (all free / unlocked) ---------------------------------

export const hasBranding = (_plan?: Plan): boolean => { void _plan; return true; };
export const hasAiSummary = (_plan?: Plan): boolean => { void _plan; return true; };
export const hasWebhooks = (_plan?: Plan): boolean => { void _plan; return true; };
export const hasAdvancedAccess = (_plan?: Plan): boolean => { void _plan; return true; };
/** Unlimited seats for all workspaces. */
export const seatLimit = (_plan?: Plan): number | null => { void _plan; return null; };

export const tierLabel = (plan: Plan): string => {
  switch (normalizePlan(plan)) {
    case PLAN_ENTERPRISE: return "Enterprise";
    case PLAN_PRO_PLUS: return "Pro+";
    case PLAN_PRO: return "PRO";
    default: return "FREE";
  }
};