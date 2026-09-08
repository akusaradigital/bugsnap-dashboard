/**
 * Guards the SSRF blocklist in src/lib/safe-url.ts. Mirrored here (the lib is
 * "server-only" and cannot be imported from a plain node test), so keep the
 * two copies in step.
 *
 * Run:  node --test tests/safe-url.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

function isPrivateAddress(ip) {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
    const mapped = v6.match(/(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }

  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    a >= 224
  );
}

test("webhook SSRF guard blocks internal and metadata addresses", () => {
  const blocked = [
    "127.0.0.1",
    "0.0.0.0",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "100.64.0.1", // CGNAT
    "224.0.0.1",
    "::1",
    "fe80::1",
    "fd00::1",
    "::ffff:169.254.169.254", // IPv4-mapped metadata
    "not-an-ip",
  ];
  for (const ip of blocked) {
    assert.equal(isPrivateAddress(ip), true, `${ip} must be blocked`);
  }
});

test("webhook SSRF guard allows real public addresses", () => {
  const allowed = [
    "1.1.1.1",
    "8.8.8.8",
    "162.159.128.233", // discord webhook edge
    "13.107.42.14",
    "172.32.0.1", // just outside the private 172.16/12 range
    "2606:4700::1111",
  ];
  for (const ip of allowed) {
    assert.equal(isPrivateAddress(ip), false, `${ip} must be allowed`);
  }
});
