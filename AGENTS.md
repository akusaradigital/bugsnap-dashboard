# AGENTS.md - BugSnap Dashboard (non-Claude engines)

> `CLAUDE.md` (same directory) and `../CLAUDE.md` are canonical. This is a short pointer for engines that don't read those files.

1. Graphify, push/release policy, versioning, verification gate, color/icon/i18n rules, mobile audit, testing standard: see `../CLAUDE.md` and `CLAUDE.md` in this folder.
2. Gate for this repo: `npm run typecheck && npm test && npm run build` (+ `npm run lint` for JSX/TSX).
3. No `any` TS type. PowerShell 5.1 has no `&&` - use `;` or Bash.
4. DB migrations (`supabase/migrations/*.sql`) must be applied live in the same turn via `node scripts/apply-migration.mjs` - never leave one written-but-unapplied.
5. Only `bugsnap.akusaraproject.my.id` serves the app; `dashboard.akusaraproject.my.id` is a redirect only.
6. Never commit secrets (`.env.local`, service role keys, `sbp_*` PATs); RLS must stay enforced.
7. All icons/images referenced in JSX must exist in `public/` - verify with `node tests/check-assets.js`.

Brand/logo rules: `../BRAND.md`.
