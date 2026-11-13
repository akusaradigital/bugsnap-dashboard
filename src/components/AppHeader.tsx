"use client";

import type { ReactNode } from "react";
import { Icon } from "@/lib/iconify";

interface AppHeaderProps {
  /** Mobile-only button that opens the sidebar drawer. Desktop keeps the sidebar pinned. */
  onOpenMenu: () => void;
  openMenuLabel: string;
  /** Search input (or a trigger that opens a command palette). */
  search: ReactNode;
  /** Right-hand actions: notifications bell, language, account menu, etc. */
  actions: ReactNode;
}

/**
 * Shared top bar for the user dashboard and the admin console.
 * Layout and breakpoints live here, so both stay identical. Data and menus
 * stay in each layout, because the user and admin data sources differ.
 */
export function AppHeader({ onOpenMenu, openMenuLabel, search, actions }: AppHeaderProps) {
  return (
    <header className="shrink-0 flex items-center gap-2 sm:gap-4 border-b border-border bg-subtle px-3 sm:px-6 py-2.5 sm:py-3">
      <button
        type="button"
        onClick={onOpenMenu}
        className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors touch-manipulation shrink-0"
        aria-label={openMenuLabel}
      >
        <Icon icon="lucide:menu" className="w-5 h-5" aria-hidden="true" />
      </button>

      <div className="flex-1 max-w-xl min-w-0">{search}</div>

      <div className="flex items-center gap-1.5 sm:gap-3 ml-auto shrink-0">{actions}</div>
    </header>
  );
}
