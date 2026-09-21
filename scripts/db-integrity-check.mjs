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

async function check() {
  const checks = [
    {
      name: "workspaces with invalid owner_user_id",
      sql: "SELECT count(*) FROM workspaces w WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = w.owner_user_id);",
    },
    {
      name: "workspace_members with invalid user_id",
      sql: "SELECT count(*) FROM workspace_members wm WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = wm.user_id);",
    },
    {
      name: "captures with invalid workspace_id",
      sql: "SELECT count(*) FROM captures c WHERE c.workspace_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.id = c.workspace_id);",
    },
    {
      name: "captures with invalid user_id",
      sql: "SELECT count(*) FROM captures c WHERE c.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.user_id);",
    },
    {
      name: "comments with invalid capture_id",
      sql: "SELECT count(*) FROM comments cm WHERE NOT EXISTS (SELECT 1 FROM captures c WHERE c.id = cm.capture_id);",
    },
    {
      name: "capture_views with invalid capture_id",
      sql: "SELECT count(*) FROM capture_views cv WHERE NOT EXISTS (SELECT 1 FROM captures c WHERE c.id = cv.capture_id);",
    },
    {
      name: "audit_logs with invalid capture_id",
      sql: "SELECT count(*) FROM audit_logs a WHERE a.capture_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM captures c WHERE c.id = a.capture_id);",
    },
    {
      name: "rate_limits expired rows",
      sql: "SELECT count(*) FROM rate_limits WHERE reset_at < now();",
    },
    {
      name: "google_drive_oauth_states expired rows",
      sql: "SELECT count(*) FROM google_drive_oauth_states WHERE expires_at < now();",
    },
    {
      name: "comment_spam_guard expired rows (older than 1 day)",
      sql: "SELECT count(*) FROM comment_spam_guard WHERE last_post_at < now() - interval '1 day';",
    },
    {
      name: "captures expired (expires_at in past and not soft-deleted/deleted)",
      sql: "SELECT count(*) FROM captures WHERE expires_at IS NOT NULL AND expires_at < now();",
    },
    {
      name: "captures burn_after_read viewed",
      sql: "SELECT count(*) FROM captures WHERE burn_after_read = true AND view_count > 0;",
    },
    {
      name: "workspaces without default project",
      sql: "SELECT count(*) FROM workspaces w WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.workspace_id = w.id AND p.is_default = true);",
    },
    {
      name: "workspaces without default folder",
      sql: "SELECT count(*) FROM workspaces w WHERE NOT EXISTS (SELECT 1 FROM workspace_folders f WHERE f.workspace_id = w.id AND f.is_default = true);",
    },
  ];

  for (const c of checks) {
    try {
      const [{ count }] = await runQuery(c.sql);
      console.log(`${c.name}: ${count}`);
    } catch (err) {
      console.error(`${c.name}: ERROR ${err.message}`);
    }
  }
}

check().catch(console.error);
