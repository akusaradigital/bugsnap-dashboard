// =====================================================================
// BugSnap Lightweight A/B Testing & Conversion Analytics Framework
// ponytail: deterministic FNV-1a hash routing, zero heavy 3rd-party libs.
// =====================================================================

"use client";

import { useState, useEffect, useCallback } from "react";

export interface ExperimentVariant {
  id: string;
  weight?: number; // Integer weight (defaults to equal distribution)
}

export interface ExperimentConfig {
  id: string;
  name: string;
  variants: ExperimentVariant[];
  defaultVariant?: string;
  active?: boolean;
}

// Built-in Experiment Registry
export const EXPERIMENTS: Record<string, ExperimentConfig> = {
  landing_hero_cta: {
    id: "landing_hero_cta",
    name: "Landing Hero CTA Style",
    variants: [
      { id: "control", weight: 50 },
      { id: "variant_speed", weight: 50 },
    ],
    defaultVariant: "control",
    active: true,
  },
  pricing_guarantee: {
    id: "pricing_guarantee",
    name: "Pricing Google Drive Guarantee Callout",
    variants: [
      { id: "control", weight: 50 },
      { id: "variant_badge", weight: 50 },
    ],
    defaultVariant: "control",
    active: true,
  },
};

/**
 * 32-bit FNV-1a hash for deterministic bucket allocation.
 * Returns an integer in range [0, 99].
 */
export function hashExperiment(visitorId: string, experimentId: string): number {
  const str = `${visitorId}:${experimentId}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

/**
 * Retrieves or generates an anonymous, privacy-safe visitor ID.
 * Persists to cookie and localStorage.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server_anon";

  try {
    // 1. Check cookie
    const match = document.cookie.match(/(?:^|;\s*)bs_vid=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }

    // 2. Check localStorage
    const stored = localStorage.getItem("bs_vid");
    if (stored) {
      document.cookie = `bs_vid=${encodeURIComponent(stored)}; path=/; max-age=31536000; SameSite=Lax`;
      return stored;
    }

    // 3. Generate new ID
    const newId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("bs_vid", newId);
    document.cookie = `bs_vid=${encodeURIComponent(newId)}; path=/; max-age=31536000; SameSite=Lax`;
    return newId;
  } catch {
    return `v_mem_${Date.now().toString(36)}`;
  }
}

/**
 * Deterministically resolves which variant a visitor should see.
 */
export function resolveExperiment(
  experimentId: string,
  explicitVisitorId?: string
): { variantId: string; visitorId: string } {
  const visitorId = explicitVisitorId || getOrCreateVisitorId();
  const exp = EXPERIMENTS[experimentId];

  if (!exp || !exp.active || !exp.variants || exp.variants.length === 0) {
    return { variantId: exp?.defaultVariant || "control", visitorId };
  }

  const totalWeight = exp.variants.reduce((acc, v) => acc + (v.weight ?? 1), 0);
  const bucket = hashExperiment(visitorId, experimentId); // 0..99
  const scaledBucket = (bucket / 100) * totalWeight;

  let cumulative = 0;
  for (const variant of exp.variants) {
    cumulative += variant.weight ?? 1;
    if (scaledBucket < cumulative) {
      return { variantId: variant.id, visitorId };
    }
  }

  return { variantId: exp.variants[0].id, visitorId };
}

/**
 * Sends an experiment event to the tracking API via sendBeacon or keepalive fetch.
 */
export function sendExperimentEvent(payload: {
  visitorId: string;
  experimentId: string;
  variantId: string;
  type: "impression" | "conversion";
  goal?: string;
  metadata?: Record<string, unknown>;
}): void {
  if (typeof window === "undefined") return;

  try {
    const data = JSON.stringify(payload);
    const url = "/api/track/experiment";

    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Fail silent: analytics never block user experience
  }
}

/**
 * Tracks an impression once per session per variant to prevent inflated views.
 */
export function trackExperimentImpression(
  experimentId: string,
  variantId: string,
  visitorId?: string
): void {
  if (typeof window === "undefined") return;

  const vid = visitorId || getOrCreateVisitorId();
  const sessionKey = `bs_exp_imp_${experimentId}_${variantId}`;

  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
  } catch {
    // Storage access might throw in private mode; continue
  }

  sendExperimentEvent({
    visitorId: vid,
    experimentId,
    variantId,
    type: "impression",
  });
}

/**
 * Tracks a goal conversion for an experiment.
 */
export function trackExperimentConversion(
  experimentId: string,
  goal: string,
  metadata?: Record<string, unknown>,
  visitorId?: string
): void {
  const vid = visitorId || getOrCreateVisitorId();
  const { variantId } = resolveExperiment(experimentId, vid);

  sendExperimentEvent({
    visitorId: vid,
    experimentId,
    variantId,
    type: "conversion",
    goal,
    metadata,
  });
}

/**
 * React hook for consuming experiments in client components.
 */
export function useExperiment(
  experimentId: string,
  fallbackVariant = "control"
): {
  variant: string;
  isReady: boolean;
  trackConversion: (goal: string, metadata?: Record<string, unknown>) => void;
} {
  const [variant, setVariant] = useState<string>(fallbackVariant);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const { variantId, visitorId } = resolveExperiment(experimentId);
    setVariant(variantId);
    setIsReady(true);
    trackExperimentImpression(experimentId, variantId, visitorId);
  }, [experimentId]);

  const trackConversion = useCallback(
    (goal: string, metadata?: Record<string, unknown>) => {
      trackExperimentConversion(experimentId, goal, metadata);
    },
    [experimentId]
  );

  return { variant, isReady, trackConversion };
}
