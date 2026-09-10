// Filtering helper for browser extension internal artifacts, trackers, and telemetry
// Extracted to avoid SSR / dynamic bundling split issues.

export const TRACKER_PATTERNS = [
  /\.supabase\.co/i,
  /bugsnap\.akusaraproject\.my\.id/i,
  /googleapis\.com/i,
  /googleusercontent\.com/i,
  /accounts\.google\.com/i,
  /apis\.google\.com/i,
  /atlassian\.com/i,
  /atlassian\.net/i,
  /google-analytics\.com/i,
  /analytics\.google\.com/i,
  /googletagmanager\.com/i,
  /sentry\.io/i,
  /mixpanel\.com/i,
  /hotjar\.com/i,
  /hotjar\.io/i,
  /amplitude\.com/i,
  /\bstatsig\b/i,
  /statsig\.com/i,
  /segment\.io/i,
  /doubleclick\.net/i,
  /facebook\.net/i,
  /browser-intake-datadoghq\.com/i,
  /analytics/i,
  /telemetry/i,
  /tracking/i,
];

export function isIgnoredUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  if (
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("moz-extension://") ||
    lower.startsWith("safari-extension://") ||
    lower.startsWith("edge-extension://") ||
    lower.startsWith("chrome://") ||
    lower.startsWith("edge://") ||
    lower.startsWith("about:") ||
    lower.startsWith("blob:chrome-extension://") ||
    lower.includes("/record_bar.html") ||
    lower.includes("record_controls.js")
  ) {
    return true;
  }
  return TRACKER_PATTERNS.some((pattern) => pattern.test(url));
}
