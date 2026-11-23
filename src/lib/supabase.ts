import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${encodeURIComponent(name)}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  try {
    const encodedVal = encodeURIComponent(value);
    if (encodedVal.length > 3800) return;
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `${encodeURIComponent(name)}=${encodedVal}; path=/; max-age=31536000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  } catch {
    // Blocked cookies or sandboxed iframe
  }
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  try {
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  } catch {
    // Blocked cookies or sandboxed iframe
  }
}

// Dual storage adapter: mirrors localStorage to first-party SameSite=Lax cookies.
// On macOS Safari / iOS, ITP bounce-tracking protections or private browsing can isolate
// or wipe localStorage across OAuth redirect chains (BugSnap -> Google -> Supabase -> BugSnap).
// Cookies with SameSite=Lax survive cross-domain top-level navigations, preventing PKCE
// code_verifier loss and AuthPKCECodeVerifierMissingError loops.
const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    let val: string | null = null;
    try {
      val = window.localStorage.getItem(key);
    } catch {
      // localStorage restricted in Safari private mode
    }
    if (!val) {
      val = readCookie(key);
      if (val) {
        try {
          window.localStorage.setItem(key, val);
        } catch { /* ignore */ }
      }
    }
    return val;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch { /* ignore */ }
    writeCookie(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch { /* ignore */ }
    removeCookie(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: hybridStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
