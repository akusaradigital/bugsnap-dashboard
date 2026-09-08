"use client";

import { supabase } from "@/lib/supabase";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for instant navigation transitions (SWR style)
const memoryCache = new Map<string, CacheEntry<unknown>>();
let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Fast header getter that caches auth token to avoid repeated getSession() lock delays.
 * The browser also automatically includes the httpOnly admin_session cookie.
 */
export async function getAdminHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    headers["Authorization"] = `Bearer ${cachedToken}`;
    return headers;
  }

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      cachedToken = token;
      tokenExpiry = (data.session?.expires_at ? data.session.expires_at * 1000 : now + 3600 * 1000) - 60000;
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Fall back to httpOnly admin_session cookie sent automatically by browser
  }

  return headers;
}

export function getAdminCache<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  return entry.data;
}

export function setAdminCache<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearAdminCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}
