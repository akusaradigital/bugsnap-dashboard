"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";
import { CHROME_STORE_URL } from "@/lib/constants";

interface HelpMenuProps {
  className?: string;
}

export default function HelpMenu({ className = "" }: HelpMenuProps) {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmenuEnter = () => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
    setSubmenuOpen(true);
  };

  const handleSubmenuLeave = () => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
    }
    submenuTimerRef.current = setTimeout(() => {
      setSubmenuOpen(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (submenuTimerRef.current) {
        clearTimeout(submenuTimerRef.current);
      }
    };
  }, []);

  // Close on outside click (capture phase so it works inside transformed sidebar) or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
        setSubmenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSubmenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleReportIssue = (e: React.MouseEvent) => {
    setIsOpen(false);
    setSubmenuOpen(false);
    if (typeof window !== "undefined") {
      const hasSupportWidget = Boolean(document.querySelector("[data-support-widget]"));
      if (hasSupportWidget) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("open-support-modal", { detail: { category: "bug" } })
        );
      }
    }
  };

  const closeAll = () => {
    setIsOpen(false);
    setSubmenuOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative select-none ${className}`}>
      {/* Trigger button: circle ? icon via Iconify */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSubmenuOpen(false);
        }}
        aria-label={t("helpMenu.helpAndResources")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#89BD49]/30 ${
          isOpen
            ? "border-[#89BD49] bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666]"
            : "border-border bg-white dark:bg-zinc-900 text-muted hover:text-foreground hover:bg-subtle hover:border-border/80"
        }`}
      >
        <Icon icon="lucide:help-circle" className="w-4 h-4 shrink-0" aria-hidden="true" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label={t("helpMenu.helpAndResources")}
          className="absolute bottom-full mb-2 left-0 z-50 w-56 sm:w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1 text-xs text-foreground animate-in fade-in zoom-in-95 duration-100"
        >
          {/* 1. Report an issue with BugSnap */}
          <Link
            href="/contact?category=bug"
            role="menuitem"
            onClick={handleReportIssue}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:message-square-warning"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.reportIssue")}</span>
          </Link>

          {/* 2. Contact support */}
          <Link
            href="/contact"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:life-buoy"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.contactSupport")}</span>
          </Link>

          {/* 3. Docs */}
          <Link
            href="/docs"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:file-text"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.docs")}</span>
          </Link>

          {/* 4. Connect MCP */}
          <Link
            href="/docs/mcp"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:bot"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.mcp")}</span>
          </Link>

          {/* 5. Security */}
          <Link
            href="/security"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:shield-check"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.security")}</span>
          </Link>

          {/* 6. System status */}
          <Link
            href="/status"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:activity"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.systemStatus")}</span>
          </Link>

          {/* 7. Pricing */}
          <Link
            href="/pricing"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:circle-dollar-sign"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.pricing")}</span>
          </Link>

          {/* 8. Blog */}
          <Link
            href="/blog"
            role="menuitem"
            onClick={closeAll}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon
              icon="lucide:newspaper"
              className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
              aria-hidden="true"
            />
            <span className="truncate flex-1">{t("helpMenu.blog")}</span>
          </Link>

          {/* Divider */}
          <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

          {/* 9. Install BugSnap with Browser Submenu */}
          <div
            className="relative"
            onMouseEnter={handleSubmenuEnter}
            onMouseLeave={handleSubmenuLeave}
          >
            <button
              type="button"
              onClick={() => {
                if (submenuTimerRef.current) {
                  clearTimeout(submenuTimerRef.current);
                  submenuTimerRef.current = null;
                }
                setSubmenuOpen((prev) => !prev);
              }}
              aria-expanded={submenuOpen}
              aria-haspopup="true"
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${
                submenuOpen ? "bg-slate-100 dark:bg-zinc-800 text-foreground" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  icon="lucide:download"
                  className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400"
                  aria-hidden="true"
                />
                <span className="truncate">{t("helpMenu.install")}</span>
              </div>
              <Icon
                icon="lucide:chevron-right"
                className={`w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500 transition-transform ${
                  submenuOpen ? "rotate-90 sm:rotate-0" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Invisible bridge over the 6px gap to prevent premature pointer leave */}
            {submenuOpen && (
              <div
                className="hidden sm:block absolute left-full top-0 bottom-0 w-3 -ml-0.5 z-[59]"
                onMouseEnter={handleSubmenuEnter}
                onMouseLeave={handleSubmenuLeave}
                aria-hidden="true"
              />
            )}

            {/* Desktop Flyout Submenu */}
            {submenuOpen && (
              <div
                role="menu"
                aria-label={t("helpMenu.install")}
                onMouseEnter={handleSubmenuEnter}
                onMouseLeave={handleSubmenuLeave}
                className="hidden sm:block absolute left-full bottom-0 ml-1.5 z-[60] w-52 sm:w-56 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1 text-xs text-foreground overflow-hidden animate-in fade-in zoom-in-95 duration-100 before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']"
              >
                {/* Chrome */}
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">{t("helpMenu.installChrome")}</span>
                  </div>
                  <span className="text-[10px] text-muted shrink-0">Store</span>
                </a>

                {/* Edge */}
                <Link
                  href="/extension#edge"
                  role="menuitem"
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon icon="logos:microsoft-edge" className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">{t("helpMenu.installEdge")}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    {t("helpMenu.comingSoon")}
                  </span>
                </Link>

                {/* Firefox */}
                <Link
                  href="/extension#firefox"
                  role="menuitem"
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon icon="logos:firefox" className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">{t("helpMenu.installFirefox")}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    {t("helpMenu.comingSoon")}
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile Inline Collapsible Submenu */}
            {submenuOpen && (
              <div className="sm:hidden pl-4 pr-2 py-1 space-y-0.5 bg-slate-50/70 dark:bg-zinc-850/60 border-t border-slate-100 dark:border-zinc-800">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon icon="logos:chrome" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t("helpMenu.installChrome")}</span>
                  </div>
                  <span className="text-[9px] text-muted">Store</span>
                </a>

                <Link
                  href="/extension#edge"
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon icon="logos:microsoft-edge" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t("helpMenu.installEdge")}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {t("helpMenu.comingSoon")}
                  </span>
                </Link>

                <Link
                  href="/extension#firefox"
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon icon="logos:firefox" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t("helpMenu.installFirefox")}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {t("helpMenu.comingSoon")}
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
