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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Query failed ${res.status}: ${text}\nQuery: ${query}`);
  }
  return res.json();
}

async function audit() {
  console.log("=== TABLE COUNTS ===");
  const tables = await runQuery(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  for (const { table_name } of tables) {
    try {
      const [{ count }] = await runQuery(`SELECT count(*) as count FROM "${table_name}";`);
      console.log(`${table_name}: ${count}`);
    } catch (e) {
      console.log(`${table_name}: ERROR ${e.message}`);
    }
  }

  console.log("\n=== RLS STATUS & POLICIES ===");
  const rls = await runQuery(`
    SELECT
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);
  console.log(JSON.stringify(rls, null, 2));

  const policies = await runQuery(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log(`Total Policies: ${policies.length}`);

  console.log("\n=== FOREIGN KEYS ===");
  const fks = await runQuery(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log(JSON.stringify(fks, null, 2));

  console.log("\n=== INDEXES ===");
  const indexes = await runQuery(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  console.log(`Total Indexes: ${indexes.length}`);
  for (const idx of indexes) {
    console.log(`${idx.tablename}: ${idx.indexname} -> ${idx.indexdef}`);
  }

  console.log("\n=== FUNCTIONS IN PUBLIC ===");
  const fns = await runQuery(`
    SELECT
      p.proname,
      p.prosecdef,
      p.provolatile,
      p.proleakproof,
      p.proisstrict,
      pg_get_function_identity_arguments(p.oid) as args,
      pg_get_function_result(p.oid) as return_type,
      p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname;
  `);
  console.log(`Total Functions: ${fns.length}`);
  for (const fn of fns) {
    console.log(`${fn.proname}(${fn.args}): returns ${fn.return_type} | secdef: ${fn.prosecdef} | search_path: ${fn.proconfig || 'NONE'}`);
  }

  console.log("\n=== TRIGGERS ===");
  const triggers = await runQuery(`
    SELECT
      event_object_table,
      trigger_name,
      event_manipulation,
      action_timing,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);
  console.log(JSON.stringify(triggers, null, 2));
}

audit().catch(console.error);
