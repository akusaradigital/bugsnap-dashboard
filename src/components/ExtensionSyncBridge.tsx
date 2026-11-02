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

    // Check current session on mount and broadcast
    supabase.auth.getSession().then(({ data }) => {
      broadcastSession(data.session?.user || null);
    }).catch(() => {});

    // Listen to all auth state changes across the whole app
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        window.postMessage(
          { source: "bugsnap-web", action: "sync_logout" },
          window.location.origin
        );
      } else if (session?.user) {
        broadcastSession(session.user);
      }
    });

    // Listen for messages from extension content script
    const handleExtensionMsg = async (e: MessageEvent) => {
      if (e.source !== window) return;
      if (e.data?.source === "bugsnap-extension") {
        if (e.data.action === "ready") {
          const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          broadcastSession(data.session?.user || null);
        } else if (e.data.action === "extension_logout") {
          try {
            localStorage.removeItem("BugSnap_notif_last_seen");
            localStorage.removeItem("BugSnap_notif_read_ids");
            localStorage.removeItem("BugSnap_promo_dismissed");
            sessionStorage.removeItem("bs_drive_quota");
          } catch {}
          await supabase.auth.signOut().catch(() => {});
          if (window.location.pathname.startsWith("/dashboard") || window.location.pathname.startsWith("/settings")) {
            window.location.assign("/login");
          } else {
            window.location.reload();
          }
        }
      }
    };

    window.addEventListener("message", handleExtensionMsg);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("message", handleExtensionMsg);
    };
  }, []);

  return null;
}
