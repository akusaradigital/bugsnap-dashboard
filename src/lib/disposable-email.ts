// Fast lookup of known disposable / throwaway email provider domains
// Prevents free quota farming and flags burner emails in the admin panel.

const DISPOSABLE_DOMAINS = new Set([
  // Popular throwaway services
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "trashmail.com",
  "trashmail.net",
  "sharklasers.com",
  "dispostable.com",
  "fakeinbox.com",
  "getairmail.com",
  "mohmal.com",
  "burnermail.io",
  "crazymailing.com",
  "inboxkitten.com",
  "generator.email",
  "getnada.com",
  "abacusmail.net",
  "emailondeck.com",
  "dropmail.me",
  "fakemailgenerator.com",
  "mintemail.com",
  "trashmail.me",
  "mytemp.email",
  "tmpmail.net",
  "tmpmail.org",
]);

/**
 * Checks if an email uses a known throwaway/disposable provider domain.
 */
export function isDisposableEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}
