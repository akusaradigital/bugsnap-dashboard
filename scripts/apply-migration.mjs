// Apply a .sql file to the live Supabase project via the Management API.
// Reads SUPABASE_PAT + NEXT_PUBLIC_SUPABASE_URL from .env.local; the project ref
// is the subdomain of that URL. No CLI, no db password, no linked local project.
//
//   node scripts/apply-migration.mjs supabase/migrations/<file>.sql
//   node scripts/apply-migration.mjs --sql "select 1"
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_0-9]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const pat = env.SUPABASE_PAT;
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
if (!pat) throw new Error("SUPABASE_PAT missing from .env.local");

const arg = process.argv[2];
const query = arg === "--sql" ? process.argv[3] : readFileSync(arg, "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`FAILED ${res.status}: ${text}`);
  process.exit(1);
}
console.log(`OK ${res.status}`);
console.log(text.slice(0, 4000));
