# AGENTS.md — BugSnap Dashboard Rules

> Quick reference for AI agents working on `bugsnap-dashboard`.

## Critical Rules

1. **Graphify MANDATORY**: Read `../graphify-out/GRAPH_REPORT.md` before touching code. No sweep-reading.
2. **Tools**: Use `PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`. No `cat`.
3. **No auto-push**: NEVER `git push` without explicit instruction.
4. **PowerShell 5.1**: No `&&` — use `;` or Bash tool.
5. **Free tier stubs**: `tiers.ts` + `quota.ts` are deliberately unlimited. Do NOT add paywalls.
6. **i18n**: All UI text via `src/lib/i18n.ts` + `useT()`. Both `en` + `id`. No hardcoded strings.
7. **No `any` TS type**: Proper types only.
8. **DB changes apply immediately**: A new `supabase/migrations/*.sql` is not done until it runs against the live project. Execute it with `node scripts/apply-migration.mjs <file.sql>` (Management API + `SUPABASE_PAT` from `.env.local`) in the same turn it is written. Snapshot what you are replacing first — `--sql "select pg_get_functiondef(...)"` — and verify afterwards. Never leave a migration written-but-unapplied.

## Versioning (SemVer — ONLY on git push to main)

- **DILARANG bump version di setiap commit lokal**: Jangan menaikkan versi pada setiap perbaikan atau commit rutin lokal agar versi tidak terus melonjak.
- **HANYA bump saat push ke `main`**: Bump `package.json` + `package-lock.json` hanya saat user secara eksplisit meminta `git push` ke `main` (production deploy).
- Current: **`0.7.0`**
- PATCH `0.7.0 → 0.7.1` | MINOR `0.7.x → 0.8.0` | MAJOR `0.x → 1.0.0`

## Architecture

- **Extension bridge**: Extension writes via `insert_capture_by_email` RPC (`SECURITY DEFINER`, bypasses RLS). Extension has no Supabase session.
- **Admin Supabase Monitor**: `/admin/supabase` + `/api/admin/supabase-stats` (DB size, storage, pool metrics).
- **DevTools**: `captures.dev_logs` (JSONB) → 4-tab panel + AI Clue.
- **Network 1st/3rd-party**: Relative URLs (`/api/...`) resolve against capture origin base (`new URL(url, base)`), `www.` normalized, default 1st-party.
- **DOM Replay**: `rrweb` recorded events played back in dashboard.
- **`src/lib/redact.ts`**: Server-side only — never import client-side.

## Image & Asset Safety

- Static assets in `public/`: verify via `node tests/check-assets.js` (0 missing).
- External images (`avatar_url`, custom branding): must have `onError` fallback to initial-letter badge or `/icon.svg`.
- Lint warnings for `no-img-element` are expected for dynamic URLs and suppressed via `// eslint-disable-next-line`.

## Commands

```bash
npm test                  # 20+ unit/contract suites
npm run typecheck         # tsc --noEmit
npm run build             # Must pass with 0 errors
node tests/check-assets.js # Verify static images
```
