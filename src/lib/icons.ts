/**
 * Centralized Icon Asset Registry for BugSnap.
 * All icon identifiers are backed by Iconify (@iconify/react) using the Lucide icon set.
 * Standardizes navigation, action, status, and diagnostic icons across the application.
 */

export const APP_ICONS = {
  // Navigation & Shell
  nav: {
    dashboard: "lucide:layout-dashboard",
    captures: "lucide:camera",
    compare: "lucide:columns-2",
    settings: "lucide:settings",
    workspaces: "lucide:building-complex",
    users: "lucide:users",
    revenue: "lucide:trending-up",
    aiAnalytics: "lucide:bar-chart-2",
    support: "lucide:message-square",
    extensionFleet: "lucide:puzzle",
    emailHealth: "lucide:mail",
    supabase: "lucide:database",
    system: "lucide:activity",
    securityAudit: "lucide:shield-check",
    errorSpikes: "lucide:alert-triangle",
    setup: "lucide:sliders",
    home: "lucide:house",
    changelog: "lucide:file-text",
    uninstallFeedback: "lucide:log-out",
  },
  // Actions & Controls
  action: {
    check: "lucide:check",
    close: "lucide:x",
    copy: "lucide:copy",
    edit: "lucide:pencil",
    delete: "lucide:trash-2",
    refresh: "lucide:refresh-cw",
    search: "lucide:search",
    download: "lucide:download",
    share: "lucide:share-2",
    externalLink: "lucide:external-link",
    filter: "lucide:filter",
    play: "lucide:play",
    pause: "lucide:pause",
    folder: "lucide:folder",
    sparkles: "lucide:sparkles",
    help: "lucide:help-circle",
    lock: "lucide:lock",
    swap: "lucide:repeat",
    split: "lucide:split",
    layers: "lucide:layers",
    columns: "lucide:columns-2",
  },
  // Status & Diagnostics
  status: {
    healthy: "lucide:check-circle-2",
    warning: "lucide:alert-triangle",
    error: "lucide:alert-circle",
    info: "lucide:info",
    gift: "lucide:gift",
    eye: "lucide:eye",
    database: "lucide:database",
    mail: "lucide:mail",
    shieldCheck: "lucide:shield-check",
    bot: "lucide:bot",
  },
} as const;

export type AppNavIcon = typeof APP_ICONS.nav[keyof typeof APP_ICONS.nav];
export type AppActionIcon = typeof APP_ICONS.action[keyof typeof APP_ICONS.action];
export type AppStatusIcon = typeof APP_ICONS.status[keyof typeof APP_ICONS.status];
export type AppIcon = AppNavIcon | AppActionIcon | AppStatusIcon;

/**
 * Dynamic Asset Getters to retrieve icons without hardcoded strings.
 */
export function getNavIcon(key: keyof typeof APP_ICONS.nav): string {
  return APP_ICONS.nav[key];
}

export function getActionIcon(key: keyof typeof APP_ICONS.action): string {
  return APP_ICONS.action[key];
}

export function getStatusIcon(key: keyof typeof APP_ICONS.status): string {
  return APP_ICONS.status[key];
}

export function getAppIcon(path: string): string {
  const [section, key] = path.split(".") as [keyof typeof APP_ICONS, string];
  if (section && key && APP_ICONS[section]) {
    const icons = APP_ICONS[section] as Record<string, string>;
    if (icons[key]) return icons[key];
  }
  return "lucide:help-circle";
}
