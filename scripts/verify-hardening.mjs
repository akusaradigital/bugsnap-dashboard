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

async function runQuery(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function verify() {
  console.log("--- 1. Comments RLS Policies ---");
  const commentPolicies = await runQuery("SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'comments';");
  console.log(JSON.stringify(commentPolicies, null, 2));

  console.log("--- 2. Workspace Settings RLS Policies ---");
  const wsPolicies = await runQuery("SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'workspace_settings';");
  console.log(JSON.stringify(wsPolicies, null, 2));

  console.log("--- 3. Verified Indexes ---");
  const indexes = await runQuery(`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE tablename IN ('comments', 'bugsnap_api_keys', 'captures', 'capture_delete_audit', 'comment_spam_guard')
    ORDER BY tablename, indexname;
  `);
  console.log(JSON.stringify(indexes, null, 2));

  console.log("--- 4. Test Executing prune_ephemeral_data() ---");
  const pruneResult = await runQuery("SELECT public.prune_ephemeral_data() as result;");
  console.log(JSON.stringify(pruneResult, null, 2));

  console.log("--- 5. Verify move_capture_to_workspace_folder search_path & definition ---");
  const moveFn = await runQuery(`
    SELECT proname, proconfig, prosecdef
    FROM pg_proc
    WHERE proname = 'move_capture_to_workspace_folder';
  `);
  console.log(JSON.stringify(moveFn, null, 2));
}

verify().catch(console.error);
