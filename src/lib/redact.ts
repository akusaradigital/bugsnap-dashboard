// Redaction and prompt sanitization utilities for BugSnap telemetry.
// Scrubs credentials, authorization tokens, provider API keys, and PII
// before telemetry is ingested into LLM prompts or dispatched to external integrations.

export const PATTERNS: Array<[RegExp, string]> = [
  // URL query params: ?token=..., &secret=...
  [/([?&](?:token|key|secret|password|code|auth|session|signature))=[^&#\s]*/gi, "$1=[REDACTED]"],
  // URL embedded basic auth: https://user:password@example.com
  [/([a-z]{3,6}:\/\/)(?:[^:\s/@]+):(?:[^@\s/]+)@/gi, "$1[REDACTED_AUTH]@"],
  // JSON fields: "access_token": "..."
  [/"(password|secret|key|token|auth|access_token|refresh_token|api_key)":\s*"[^"]*"/gi, '"$1":"[REDACTED]"'],
  // key=value / key: value in free text
  [/(password|secret|token|api_key|apikey)(["'=:\s]+)[^\s&"',]+/gi, "$1$2[REDACTED]"],
  // Authorization headers
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]"],
  [/\bBasic\s+[A-Za-z0-9+/=]{8,}={0,2}/gi, "Basic [REDACTED]"],
  // Cookie and session headers
  [/((?:cookie|set-cookie)\s*[:=]\s*)[^\r\n;]+/gi, "$1[REDACTED_COOKIE]"],
  // JWT tokens
  [/\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.+/-]+\b/gi, "[JWT REDACTED]"],
  // Provider key formats
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, "[AWS KEY REDACTED]"],
  [/\bAIzaSy[0-9A-Za-z\-_]{33}\b/g, "[GOOGLE KEY REDACTED]"],
  [/\bxox[baprs]-[0-9A-Za-z\-_]{10,}\b/g, "[SLACK TOKEN REDACTED]"],
  [/\b[rs]k_(?:live|test)_[0-9a-zA-Z]{16,}\b/g, "[STRIPE KEY REDACTED]"],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, "[ANTHROPIC KEY REDACTED]"],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, "[OPENAI KEY REDACTED]"],
  [/\bgh[pousr]_[A-Za-z0-9]{16,}\b/g, "[GITHUB TOKEN REDACTED]"],
  [/\bre_[0-9a-zA-Z]{16,}\b/g, "[RESEND KEY REDACTED]"],
  // Card numbers (major issuers)
  [/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})\b/g, "[CARD REDACTED]"],
  // Email addresses
  [/\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}\b/g, "[REDACTED_EMAIL]"],
];

// Fields that commonly carry sensitive data in dev log records.
export const FIELDS = [
  "message",
  "text",
  "url",
  "documentUrl",
  "error",
  "requestBody",
  "responseBody",
  "stack",
  "statusText",
  "email",
] as const;

/**
 * Scrub secrets, tokens, cookies, passwords, and PII from a string.
 */
export function redactString(value: unknown): string {
  if (value === null || value === undefined) return "";
  let out = typeof value === "string" ? value : String(value);
  for (const [re, sub] of PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, sub);
  }
  return out;
}

/**
 * Sanitize error messages to ensure sensitive details (connection strings,
 * database URLs, internal IPs, service role keys, secrets) are not leaked.
 */
export function sanitizeErrorMessage(err: unknown, fallback = "Internal server error"): string {
  if (!err) return fallback;
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : fallback;
  if (!raw || typeof raw !== "string") return fallback;

  let cleaned = redactString(raw);

  // Redact database connection strings (postgres://, postgresql://, etc.)
  cleaned = cleaned.replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[DATABASE_URL_REDACTED]");

  // Redact Supabase URLs / internal hosts
  cleaned = cleaned.replace(/(?:https?:\/\/)?([a-z0-9_-]+\.supabase\.co)[^\s"'<>]*/gi, "[SUPABASE_HOST_REDACTED]");

  // Redact IPv4 internal/private IP addresses
  cleaned = cleaned.replace(
    /\b(?:127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0)\b/g,
    "[INTERNAL_IP]"
  );

  // Redact localhost and IPv6 loopback
  cleaned = cleaned.replace(/\b(?:localhost(?::\d+)?|::1|fe80:[0-9a-f:]+)\b/gi, "[INTERNAL_HOST]");

  // Truncate to reasonable length to prevent stack dump leakage
  if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 200) + "...";
  }

  return cleaned || fallback;
}

/**
 * Clean recorder frames and internal browser extension noise from stack traces.
 */
export function cleanStackTrace(stack?: string | null): string {
  if (!stack || typeof stack !== "string") return "";
  return stack
    .split(/\r?\n/)
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        !lower.includes("chrome-extension://") &&
        !lower.includes("moz-extension://") &&
        !lower.includes("safari-extension://") &&
        !lower.includes("edge-extension://") &&
        !lower.includes("injected_logger.js") &&
        !lower.includes("rrweb-record") &&
        !lower.includes("record_controls")
      );
    })
    .join("\n")
    .trim();
}

/**
 * Strip query params and embedded auth credentials from URLs before prompt ingestion.
 */
export function cleanUrlForTelemetry(url?: unknown, maxLength = 150): string {
  if (!url) return "";
  const raw = typeof url === "string" ? url.trim() : String(url).trim();
  let stripped = "";
  try {
    const u = new URL(raw);
    const origin = `${u.protocol}//${u.host}`;
    stripped = `${origin}${u.pathname}${u.search ? "?..." : ""}`;
  } catch {
    const [pathPart] = raw.split("?");
    stripped = `${pathPart}${raw.includes("?") ? "?..." : ""}`;
  }
  return sanitizePromptData(stripped, maxLength);
}

/**
 * Sanitizes untrusted telemetry strings before formatting into an LLM prompt:
 * 1. Safely coerces input to string without throwing on objects or circular data.
 * 2. Enforces early length budgeting to protect context window and regex performance.
 * 3. Neutralizes delimiter breakouts (e.g. </dev_logs_untrusted>) and role-spoofing tags.
 * 4. Runs thorough secret and credential redaction.
 */
export function sanitizePromptData(value: unknown, maxLength = 250): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (typeof value === "string") {
    str = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    str = String(value);
  } else {
    try {
      str = JSON.stringify(value);
    } catch {
      str = "";
    }
  }

  // 1. Truncate early to prevent regex Denial of Service on massive inputs
  str = str.slice(0, maxLength);

  // 2. Neutralize XML delimiter breaking and system tag injections
  str = str
    .replace(/<\/?(?:dev_logs_untrusted|dev_logs|system|user|assistant|prompt|instruction)[^>]*>/gi, "[filtered-tag]");

  // 3. Apply secret redaction
  return redactString(str);
}

/**
 * Scrubs known sensitive fields across a log object while preserving unaffected properties.
 */
export function redactLog<T extends Record<string, unknown>>(log: T): T {
  if (!log || typeof log !== "object") return log;
  const clean = { ...log };
  for (const key of FIELDS) {
    if (typeof clean[key] === "string") {
      (clean as Record<string, unknown>)[key] = redactString(clean[key] as string);
    }
  }
  return clean;
}
