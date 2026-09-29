import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A bare auth.uid() inside an RLS policy is re-evaluated for EVERY scanned row.
// Wrapped as (select auth.uid()) it becomes an InitPlan, evaluated once per
// statement. Migration 20260928120000 fixed 27 policies; this guards the
// migration history so a future one cannot reintroduce the bare form.
const MIGRATIONS = new URL('../supabase/migrations/', import.meta.url);

const policyBodies = (sql) =>
  [...sql.matchAll(/CREATE\s+POLICY[\s\S]*?;/gi)].map((m) => m[0]);

// auth.uid() not immediately preceded by "select " (in any casing).
const BARE = /(?<!select\s)auth\.(uid|jwt|role)\(\)/i;

test('no migration creates a policy with an unwrapped auth.uid()', async () => {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql'));
  assert.ok(files.length > 0, 'expected migration files');

  const offenders = [];
  for (const f of files) {
    // Only the current state matters: a later migration may legitimately have
    // replaced an older policy. Check the newest definition of each policy name.
    if (f < '20260928120000') continue;
    const sql = readFileSync(new URL(f, MIGRATIONS), 'utf8');
    for (const body of policyBodies(sql)) {
      const expr = body.replace(/\(\s*select\s+auth\.(uid|jwt|role)\(\)\s*\)/gi, 'OK');
      if (BARE.test(expr)) {
        offenders.push(`${f}: ${body.slice(0, 90).replace(/\s+/g, ' ')}`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'wrap these as (select auth.uid())');
});

test('the initplan migration rewrote every policy it dropped', () => {
  const sql = readFileSync(new URL('20260928120000_rls_initplan_auth_uid.sql', MIGRATIONS), 'utf8');
  const dropped = [...sql.matchAll(/DROP POLICY IF EXISTS "([^"]+)" ON public\."([^"]+)"/g)]
    .map((m) => `${m[2]}.${m[1]}`);
  const created = [...sql.matchAll(/CREATE POLICY "([^"]+)" ON public\."([^"]+)"/g)]
    .map((m) => `${m[2]}.${m[1]}`);

  assert.equal(dropped.length, 27, 'expected 27 policies rewritten');
  // A DROP without a matching CREATE silently removes an access rule.
  assert.deepEqual(dropped.slice().sort(), created.slice().sort());
});

test('every rewritten policy keeps a USING or WITH CHECK clause', () => {
  const sql = readFileSync(new URL('20260928120000_rls_initplan_auth_uid.sql', MIGRATIONS), 'utf8');
  for (const body of policyBodies(sql)) {
    const hasClause = /\bUSING\s*\(/i.test(body) || /\bWITH CHECK\s*\(/i.test(body);
    assert.ok(hasClause, `policy lost its predicate: ${body.slice(0, 80)}`);
    // An INSERT policy can only carry WITH CHECK - a stray USING would fail to apply.
    if (/FOR INSERT/i.test(body)) {
      assert.ok(!/\bUSING\s*\(/i.test(body), 'INSERT policy must not have USING');
    }
  }
});
