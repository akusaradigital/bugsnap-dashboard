# CLAUDE.md - BugSnap Dashboard

> Rules for Claude Code and AI agents on `bugsnap-dashboard` (Next.js 14, Supabase, App Router).
> Cross-repo rules (push/release, versioning, Graphify, testing standard, verification gates, color system, i18n policy, brand) live in `../CLAUDE.md` and `../BRAND.md` - this file only holds what's specific to this repo.

## 1. Critical Rules

1. **Graphify, push, versioning, gates, subagent delegation**: see `../CLAUDE.md` §1-4. This repo's gate command is in §7 below.
2. **Tooling**: `PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`. No `cat`. PowerShell 5.1 has no `&&` - use `;` or the Bash tool.
3. **No `any` TS type** - `@typescript-eslint/no-explicit-any` is enforced.
4. **Icon registry**: use `src/lib/icons.ts` as the shared registry for nav/action/status icons; run `tests/icons.test.mjs` after adding one. Third-party logos go through `src/lib/third-party-logos.json` + `src/lib/iconify.ts`, per `../BRAND.md`. BugSnap's own logo is immutable - exclude it from any visual audit/edit.
5. **DB changes apply immediately**:

```bash
node scripts/apply-migration.mjs --sql "<snapshot query, e.g. pg_get_functiondef>"  # snapshot first
node scripts/apply-migration.mjs supabase/migrations/<file>.sql                    # apply
node scripts/apply-migration.mjs --sql "<verification query>"                      # verify
```

   Uses `SUPABASE_PAT` + `NEXT_PUBLIC_SUPABASE_URL` from `.env.local` (Management API, no CLI/DB password needed). Save the pre-change definition to `supabase/.rollback-<object>-<date>.json`. Never leave a migration written-but-unapplied.
6. **Focused validation**: for a dashboard-only change, run `npm run typecheck` + targeted tests + `npm run lint` (JSX/TSX) first - don't run extension/MCP suites. Use the full gate (§7) for release/commit validation.

## 2. Versioning

- Bump `package.json` + `package-lock.json` only when the user explicitly requests a production/main push (see `../CLAUDE.md` §2). Current: **`0.15.4`**.
- PATCH `0.7.0→0.7.1` bugfix/hotfix/copy/asset/dependency · MINOR `0.7.x→0.8.0` new feature/route/module · MAJOR `0.x→1.0.0` breaking change.
- CI does **not** auto-tag on push (removed 2026-11-10) - this repo is Vercel-deployed and was never meant to carry GitHub Releases; tag/release manually only if asked.

## 3. Architecture & Data Flow

See `../CLAUDE.md` §7 for the cross-repo flow. Dashboard-specific:
- **Admin Supabase Monitor**: `/admin/supabase` + `/api/admin/supabase-stats` - DB size, storage, connection pool metrics.
- **Network 1st/3rd-party**: `isFirstPartyUrl` in `DevToolsPanel.tsx` resolves relative URLs against `new URL(url, captureOrigin)`, normalizes `www.`, defaults to 1st-party on error.
- `src/lib/redact.ts` is server-side only - never import into client components.

## 4. Domain & DNS

- App: `bugsnap.akusaraproject.my.id` only (Vercel: `prj_07vmHWiKLnvJ3EacILxkznfkMIxt`).
- `dashboard.akusaraproject.my.id` → 301 redirect only, never serves the app directly.
- Cloudflare: `CNAME → cname.vercel-dns.com` (proxied=false).

## 5. Security Rules

1. Never commit secrets: `.env.local`, service role keys, `sbp_*` PATs.
2. RLS must stay enforced - never widen a policy to `true` for user tables.
3. Extension has no Supabase session - always use RPCs, never direct inserts.
4. Service role key: `process.env.SUPABASE_SERVICE_ROLE_KEY` - server Route Handlers only.
5. `get_public_capture` RPC nulls `password` + `expires_at` before serving to public.
6. Supabase project: `kkmvanwgywrqsudvspge.supabase.co` (fixed).

## 6. Image & Asset Safety

- All icons/images referenced in JSX must exist in `public/`. Audit: `node tests/check-assets.js`.
- All `<img>` rendering OAuth avatars, workspace logos, or custom branding URLs must have an `onError` fallback (states: `failedAvatars`, `failedWsAvatars`, `brandLogoFailed`, `logoPreviewError`).
- `no-img-element` lint warnings are expected and suppressed via `// eslint-disable-next-line` where `next/image` can't be used for a dynamic external URL.

## 7. Build & Test Commands

```bash
npm test           # 20+ unit & contract suites (Node test runner)
npm run build      # Production build - must exit with 0 errors
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run dev        # Local dev (HMR auto - restart only if .env.local or next.config.mjs changes)
node tests/check-assets.js  # Audit static asset paths in public/
```
