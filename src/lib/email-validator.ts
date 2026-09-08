// Email validator for anti-spam & delivery assurance.
// Used across client and server trust boundaries.

export type EmailValidationError =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "DISPOSABLE"
  | "DUMMY";

export interface EmailValidationResult {
  valid: boolean;
  error?: EmailValidationError;
  reason?: string;
}

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "burnermail.io",
  "crazymailing.com",
  "dispostable.com",
  "dropmail.me",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "generator.email",
  "getairmail.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "inboxkitten.com",
  "maildrop.cc",
  "mailinator.com",
  "mohmal.com",
  "mytempemail.com",
  "nada.ltd",
  "sharklasers.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

const DUMMY_LOCAL_PARTS = new Set([
  "test",
  "testing",
  "asdf",
  "admin",
  "dummy",
  "sample",
  "example",
  "123",
  "12345",
  "user",
  "fake",
  "spam",
]);

export function validateEmail(rawEmail: string): EmailValidationResult {
  const email = (rawEmail || "").trim().toLowerCase();

  if (!email) {
    return { valid: false, error: "REQUIRED", reason: "Email is required" };
  }

  // Length limits per RFC 5321 (local max 64, domain max 255, total max 254)
  if (email.length < 6 || email.length > 254) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Email length invalid" };
  }

  const atIndex = email.indexOf("@");
  const lastAtIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex !== lastAtIndex || atIndex === email.length - 1) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Must contain exactly one @" };
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // Local part rules
  if (local.length > 64) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Local part too long" };
  }
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Invalid dot placement" };
  }
  const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localRegex.test(local)) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Invalid characters in local part" };
  }

  // Domain part rules
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Invalid domain dots" };
  }

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  // TLD must be alphabetical and at least 2 chars (e.g. com, id, org, net, io)
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return { valid: false, error: "INVALID_FORMAT", reason: "Invalid top-level domain (TLD)" };
  }

  // Check each domain label
  for (const part of domainParts) {
    if (!part || part.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(part)) {
      return { valid: false, error: "INVALID_FORMAT", reason: "Invalid domain label" };
    }
  }

  // Check disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: "DISPOSABLE", reason: "Disposable email not allowed" };
  }

  // Check obvious dummy combinations (e.g. test@test.com, asdf@asdf.com)
  const firstDomainLabel = domainParts[0];
  if (local === firstDomainLabel && DUMMY_LOCAL_PARTS.has(local)) {
    return { valid: false, error: "DUMMY", reason: "Dummy email not allowed" };
  }

  return { valid: true };
}
