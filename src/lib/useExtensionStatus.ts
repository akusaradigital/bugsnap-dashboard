"use client";

import { useEffect, useState, useCallback } from "react";
import { CHROME_STORE_URL, FIREFOX_STORE_URL } from "@/lib/constants";

export interface ExtensionStatus {
  /** null = detecting, true = installed, false = not installed */
  installed: boolean | null;
  /** Browser detected */
  browser: "firefox" | "edge" | "chrome" | "other";
  /** Is running on macOS */
  isMac: boolean;
  /** Is running on a mobile / touch device */
  isMobile: boolean;
  /** Primary store download URL matching user's browser */
  primaryStoreUrl: string;
  /** Secondary store download URL */
  secondaryStoreUrl: string;
  /** Primary store brand name */
  primaryStoreName: string;
  /** Secondary store brand name */
  secondaryStoreName: string;
  /** Shortcut string for area capture */
  hotkeyArea: string;
  /** Shortcut string for recording */
  hotkeyRecord: string;
  /** Trigger a live capture via extension */
  triggerTestCapture: (mode?: "area" | "full" | "tab") => void;
}

export function useExtensionStatus(): ExtensionStatus {
  const [installed, setInstalled] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    const win = window as unknown as { __bugsnap_extension_installed?: boolean };
    if (win.__bugsnap_extension_installed === true) return true;
    try {
      if (sessionStorage.getItem("bugsnap_ext_installed") === "true") return true;
    } catch {}
    return null;
  });

  const [env] = useState<{
    browser: "firefox" | "edge" | "chrome" | "other";
    isMac: boolean;
    isMobile: boolean;
  }>(() => {
    if (typeof navigator === "undefined") {
      return { browser: "chrome", isMac: false, isMobile: false };
    }
    const ua = navigator.userAgent;
    const isFirefox = /firefox/i.test(ua);
    const isEdge = /edg\//i.test(ua);
    const isChrome = /chrome|chromium|crios/i.test(ua) && !isEdge;
    const browser = isFirefox ? "firefox" : isEdge ? "edge" : isChrome ? "chrome" : "other";
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(ua);
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
    return { browser, isMac, isMobile };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as unknown as { __bugsnap_extension_installed?: boolean };

    const markInstalled = () => {
      setInstalled(true);
      win.__bugsnap_extension_installed = true;
      try {
        sessionStorage.setItem("bugsnap_ext_installed", "true");
      } catch {}
    };

    if (win.__bugsnap_extension_installed === true) {
      setInstalled(true);
      return;
    }

    const handleMsg = (e: MessageEvent) => {
      if (e.source !== window) return;
      if (
        e.data?.source === "bugsnap-extension" &&
        (e.data.action === "ready" || e.data.action === "pong")
      ) {
        markInstalled();
      }
    };

    const handleCustom = () => {
      markInstalled();
    };

    window.addEventListener("message", handleMsg);
    window.addEventListener("bugsnap-ext-detected", handleCustom);

    // Ping the extension content script
    window.postMessage({ source: "bugsnap-web", action: "hello" }, window.location.origin);
    window.postMessage({ source: "bugsnap-web", action: "ping" }, window.location.origin);

    // Timeout fallback if extension is not installed
    const timer = setTimeout(() => {
      setInstalled((current) => (current === null ? false : current));
    }, 750);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", handleMsg);
      window.removeEventListener("bugsnap-ext-detected", handleCustom);
    };
  }, []);

  const triggerTestCapture = useCallback((mode: "area" | "full" | "tab" = "area") => {
    if (typeof window !== "undefined") {
      window.postMessage(
        { source: "bugsnap-web", action: "trigger_capture", mode },
        window.location.origin
      );
    }
  }, []);

  const isFirefox = env.browser === "firefox";
  const primaryStoreUrl = isFirefox ? FIREFOX_STORE_URL : CHROME_STORE_URL;
  const secondaryStoreUrl = isFirefox ? CHROME_STORE_URL : FIREFOX_STORE_URL;
  const primaryStoreName = isFirefox ? "Firefox" : "Chrome";
  const secondaryStoreName = isFirefox ? "Chrome" : "Firefox";
  const hotkeyArea = env.isMac ? "⌘+Shift+S" : "Ctrl+Shift+S";
  const hotkeyRecord = env.isMac ? "⌘+Shift+F" : "Ctrl+Shift+F";

  return {
    installed,
    browser: env.browser,
    isMac: env.isMac,
    isMobile: env.isMobile,
    primaryStoreUrl,
    secondaryStoreUrl,
    primaryStoreName,
    secondaryStoreName,
    hotkeyArea,
    hotkeyRecord,
    triggerTestCapture,
  };
}
