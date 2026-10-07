# CLAUDE.md - BugSnap Dashboard

> Rules for Claude Code and AI agents on `bugsnap-dashboard` (Next.js 14, Supabase, App Router).

## 1. Critical Rules

1. **Graphify MANDATORY**: Read `../graphify-out/GRAPH_REPORT.md` before opening any file.
2. **Tooling**: `PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`. No `cat`.
3. **No auto-push**: NEVER `git push` without explicit user instruction.
4. **PowerShell 5.1**: `&&` not supported - use `;` or Bash tool.
5. **Free tier stubs**: `tiers.ts` + `quota.ts` are intentionally unlimited - do NOT add paywalls.
6. **i18n MANDATORY**: All UI text via `src/lib/i18n.ts` + `useT()`. Both `en` + `id` keys. No hardcoded strings.
7. **Design**: Solid colors, Tailwind tokens, dark/light mode. No heavy gradients.
8. **Ethics**: Never compare BugSnap to competitors in UI or docs.
9. **No `any` TS type**: Use proper types. `@typescript-eslint/no-explicit-any` is enforced.
10. **DB changes apply immediately**: A migration that only exists as a file has changed nothing. Any new `supabase/migrations/*.sql` must be executed against the live project in the same turn it is written:

```bash
node scripts/apply-migration.mjs --sql "select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='<fn>'"  # snapshot first
node scripts/apply-migration.mjs supabase/migrations/<file>.sql                                                                                                              # apply
node scripts/apply-migration.mjs --sql "<verification query>"                                                                                                               # verify
```

The script posts to the Supabase Management API using `SUPABASE_PAT` + `NEXT_PUBLIC_SUPABASE_URL` from `.env.local` (no CLI, no DB password, no linked local project). Save the pre-change definition to `supabase/.rollback-<object>-<date>.json` so there is a way back. Never leave a migration written-but-unapplied. 11. **Mobile View 360px–440px Audit (MANDATORY on Dashboard Changes)**: For every UI, component, or page change in `bugsnap-dashboard`, you MUST verify and audit responsiveness across small mobile viewports (360px–440px, usable width ~328px with 16px horizontal gutters). Horizontal overflow/scrolling is strictly forbidden. Mandatory rules: - Add `min-w-0` to flex child containers to allow nested `truncate` elements to truncate properly without overflowing. - Responsive grids: convert desktop multi-column grids (`grid-cols-2/3/4`) to `grid-cols-1 sm:grid-cols-2/3`, and use `gap-6 sm:gap-0 sm:divide-x` instead of raw `divide-x` to prevent broken border divider lines when wrapped to new rows. - Heavy headers/filters: use `relative sm:sticky top-0` so mobile viewports are not blocked by sticky elements consuming >25% of the screen. - Floating/fixed UI (toasts, batch action toolbars, modal popups, demo widgets): clamp width using `w-[min(...,calc(100vw-2rem))]` and responsive offsets `bottom-4 right-4 sm:bottom-5 sm:right-5`. - Long unbroken technical strings (emails, URLs, stack traces, identifiers): always apply `break-all`. - Modal/card padding: use `p-4 sm:p-6` or `p-4 sm:p-8` (avoid static `p-8` or `p-10`). - Media player video controls: adapt with `flex-wrap sm:flex-nowrap`, preserving scrubber track width with `min-w-[120px]`.

## 2. Versioning (SemVer - ONLY on git push to main)

- **Do NOT bump version on routine edits or local commits**: Never bump the version on routine small bugfixes or local commits to keep version numbers from unnecessarily inflating.
- **Bump ONLY when pushing to `main`**: Bump `package.json` + `package-lock.json` (top-level + `packages[""].version`) ONLY when the user explicitly instructs `git push` to `main` for production deployment.

- **PATCH** `0.7.0 → 0.7.1`: bugfix, hotfix, copy, asset, dependency.
- **MINOR** `0.7.x → 0.8.0`: new user-facing feature, route, module.
- **MAJOR** `0.x → 1.0.0`: breaking API/auth/UI change.

Current version: **`0.9.1`**

## 3. Architecture & Data Flow

```
Extension → Supabase RPC insert_capture_by_email()  [SECURITY DEFINER]
         → tables: captures, comments, workspaces, workspace_members, capture_views
         ← Dashboard (Next.js, user session, RLS-scoped reads)
```

- **Admin Supabase Monitor**: `/admin/supabase` + `/api/admin/supabase-stats` - real-time DB size, storage, connection pool metrics.
- **DevTools**: `captures.dev_logs` (JSONB) → 4-tab panel (Console, Network, Storage, System) + AI Clue.
- **Network 1st/3rd-party**: Resolve relative URLs with `new URL(url, captureOrigin)`, normalize `www.`, default to 1st-party on error. See `isFirstPartyUrl` in `DevToolsPanel.tsx`.
- **DOM Replay**: `rrweb` events stored + played back in dashboard.
- **`src/lib/redact.ts`**: Server-side only - never import into client components.

## 4. Domain & DNS

- App: `bugsnap.akusaraproject.my.id` only (Vercel: `prj_07vmHWiKLnvJ3EacILxkznfkMIxt`).
- `dashboard.akusaraproject.my.id` → 301 redirect only, never serves app directly.
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
- All `<img>` rendering OAuth avatars, workspace logos, or custom branding URLs **must** have `onError` fallback to initial-letter badge or `/icon.svg`. Use states: `failedAvatars`, `failedWsAvatars`, `brandLogoFailed`, `logoPreviewError`.
- `no-img-element` Next.js lint warnings are expected and suppressed via `// eslint-disable-next-line` for dynamic external URLs where `next/image` cannot be used.

## 7. Build & Test Commands

```bash
npm test           # 20+ unit & contract suites (Node test runner)
npm run build      # Production build - must exit with 0 errors
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run dev        # Local dev (HMR auto - restart only if .env.local or next.config.mjs changes)
node tests/check-assets.js  # Audit static asset paths in public/
```
