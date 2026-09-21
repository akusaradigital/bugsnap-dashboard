import { readFileSync, writeFileSync } from "node:fs";

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

async function runQuery(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function snapshot() {
  const rollback = {
    date: new Date().toISOString(),
    fn_move_capture: await runQuery("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'move_capture_to_workspace_folder';"),
    policies_comments: await runQuery("SELECT * FROM pg_policies WHERE tablename = 'comments';"),
    policies_workspace_settings: await runQuery("SELECT * FROM pg_policies WHERE tablename = 'workspace_settings';"),
    indexes_comments: await runQuery("SELECT * FROM pg_indexes WHERE tablename = 'comments';"),
    indexes_bugsnap_api_keys: await runQuery("SELECT * FROM pg_indexes WHERE tablename = 'bugsnap_api_keys';"),
  };

  writeFileSync("supabase/.rollback-database-hardening-20260921.json", JSON.stringify(rollback, null, 2));
  console.log("Snapshot saved to supabase/.rollback-database-hardening-20260921.json");
}

snapshot().catch(console.error);
