import "server-only";

import { lookup } from "dns/promises";

/**
 * Guard for outbound requests to a URL the user controls (webhooks).
 * Without this, a webhook URL is a request forgery primitive: the server sits
 * inside the hosting network and would happily POST to link-local metadata
 * endpoints or internal services and report back what it found.
 */
function isPrivateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (
      /^(fe[89ab]|fc|fd|ff)/i.test(v6) ||
      v6.startsWith("100:") ||
      v6.startsWith("2001:db8:")
    ) {
      return true;
    }
    // IPv4-mapped dotted-decimal (::ffff:169.254.169.254)
    const mapped = v6.match(/(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);

    // IPv4-mapped hex (e.g. ::ffff:7f00:1 or ::ffff:a9fe:a9fe)
    const hexMapped = v6.match(/(?:^|:)ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (hexMapped) {
      const high = parseInt(hexMapped[1], 16);
      const low = parseInt(hexMapped[2], 16);
      return isPrivateAddress(
        `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`
      );
    }

    return false;
  }

  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    a >= 224 // multicast + reserved
  );
}

/** Throws when the URL is not a public https/http endpoint. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) URLs are allowed");
  }

  const results = await lookup(url.hostname, { all: true }).catch(() => {
    throw new Error("Could not resolve webhook host");
  });
  if (!results.length || results.some((r) => isPrivateAddress(r.address))) {
    throw new Error("Webhook host is not publicly routable");
  }

  return url;
}
