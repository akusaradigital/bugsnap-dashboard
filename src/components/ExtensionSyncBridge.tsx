"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function ExtensionSyncBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const broadcastSession = (user: {
      id: string;
      email?: string;
      user_metadata?: { full_name?: string; avatar_url?: string };
      name?: string;
      avatar?: string;
      plan?: string;
    } | null) => {
      if (user && user.email) {
        window.postMessage(
          {
            source: "bugsnap-web",
            action: "sync_session",
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.name || "",
              avatar: user.user_metadata?.avatar_url || user.avatar || "",
            },
          },
          window.location.origin
        );
      }
      // No session is deliberately not a logout: someone who connected Drive from the extension and never signed in
      // here would be disconnected on every dashboard visit. Only a real SIGNED_OUT event, below, logs the extension out.
    };

    // Two pairings racing leave the extension holding a secret the server already replaced.
    let pairStarted = false;
    let cachedSession: { user?: { id: string; email?: string; user_metadata?: { full_name?: string; avatar_url?: string } }; access_token: string } | null = null;

    const pairExtension = (accessToken: string) => {
      if (pairStarted) return;
      pairStarted = true;
      fetch("/api/extension/pair", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.code) {
            window.postMessage({ source: "bugsnap-web", action: "pair_extension", code: json.code }, window.location.origin);
          }
        })
        .catch(() => { })
        .finally(() => {
          setTimeout(() => { pairStarted = false; }, 3000);
        });
    };

    // Check current session on mount and broadcast
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) cachedSession = data.session as typeof cachedSession;
      broadcastSession(data.session?.user || null);
      if (window.location.search.includes("drive=connected")) {
        window.postMessage({ source: "bugsnap-web", action: "sync_drive" }, window.location.origin);
      }
    }).catch(() => { });

    // Listen to all auth state changes across the whole app
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      cachedSession = (session as typeof cachedSession) || null;
      if (event === "SIGNED_OUT") {
        window.postMessage(
          { source: "bugsnap-web", action: "sync_logout" },
          window.location.origin
        );
      } else if (session?.user) {
        broadcastSession(session.user);
        if (event === "SIGNED_IN") {
          // Newly signed in: ping extension to report its pairing status
          window.postMessage({ source: "bugsnap-web", action: "hello" }, window.location.origin);
        }
      }
    });

    // Listen for messages from extension content script
    const handleExtensionMsg = async (e: MessageEvent) => {
      if (e.source !== window) return;
      if (e.data?.source === "bugsnap-extension") {
        if (e.data.action === "ready") {
          const session = cachedSession || (await supabase.auth.getSession().catch(() => ({ data: { session: null } }))).data?.session;
          if (session) cachedSession = session as typeof cachedSession;
          broadcastSession(session?.user || null);
          if (session) {
            const extEmail = typeof e.data.email === "string" ? e.data.email.toLowerCase() : "";
            const webEmail = (session.user?.email || "").toLowerCase();
            if (!e.data.paired || (extEmail && extEmail !== webEmail)) {
              pairExtension(session.access_token);
            }
            if (window.location.search.includes("drive=connected")) {
              window.postMessage({ source: "bugsnap-web", action: "sync_drive" }, window.location.origin);
            }
          }
        } else if (e.data.action === "extension_logout") {
          const onAppPage = /^\/(dashboard|settings|captures|folders|compare|admin|upgrade)(\/|$)/.test(window.location.pathname);
          // A web logout echoes back here once the extension disconnects: nothing left to sign out on a public page.
          const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (!data.session) {
            // Nothing to sign out, but the extension keeps replaying its logout until the web confirms it.
            window.postMessage({ source: "bugsnap-web", action: "sync_logout" }, window.location.origin);
            if (!onAppPage) return;
          }
          try {
            localStorage.removeItem("BugSnap_notif_last_seen");
            localStorage.removeItem("BugSnap_notif_read_ids");
            localStorage.removeItem("BugSnap_promo_dismissed");
            sessionStorage.removeItem("bs_drive_quota");
          } catch { }
          await supabase.auth.signOut().catch(() => { });
          if (onAppPage) {
            window.location.assign("/login");
          } else {
            window.location.reload();
          }
        }
      }
    };

    window.addEventListener("message", handleExtensionMsg);
    // The extension's own "ready" fires at document_start, before this listener exists, so ask for it again.
    window.postMessage({ source: "bugsnap-web", action: "hello" }, window.location.origin);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("message", handleExtensionMsg);
    };
  }, []);

  return null;
}
