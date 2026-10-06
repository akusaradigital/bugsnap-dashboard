# AGENTS.md - BugSnap Dashboard Rules

> Quick reference for AI agents working on `bugsnap-dashboard`.

## Critical Rules

1. **Graphify MANDATORY**: Read `../graphify-out/GRAPH_REPORT.md` before touching code. No sweep-reading.
2. **Tools**: Use `PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`. No `cat`.
3. **No auto-push**: NEVER `git push` without explicit instruction.
4. **PowerShell 5.1**: No `&&` - use `;` or Bash tool.
5. **Free tier stubs**: `tiers.ts` + `quota.ts` are deliberately unlimited. Do NOT add paywalls.
6. **i18n**: All UI text via `src/lib/i18n.ts` + `useT()`. Both `en` + `id`. No hardcoded strings.
7. **No `any` TS type**: Proper types only.
8. **DB changes apply immediately**: A new `supabase/migrations/*.sql` is not done until it runs against the live project. Execute it with `node scripts/apply-migration.mjs <file.sql>` (Management API + `SUPABASE_PAT` from `.env.local`) in the same turn it is written. Snapshot what you are replacing first - `--sql "select pg_get_functiondef(...)"` - and verify afterwards. Never leave a migration written-but-unapplied.
9. **Mobile View 360px–440px Audit (MANDATORY on Dashboard Changes)**: For every UI, component, or page change in `bugsnap-dashboard`, you MUST verify and audit responsiveness across small mobile viewports (360px–440px, usable width ~328px with 16px horizontal gutters). Horizontal overflow/scrolling is strictly forbidden. Mandatory rules:
   - Add `min-w-0` to flex child containers to allow nested `truncate` elements to truncate properly without overflowing.
   - Responsive grids: convert desktop multi-column grids (`grid-cols-2/3/4`) to `grid-cols-1 sm:grid-cols-2/3`, and use `gap-6 sm:gap-0 sm:divide-x` instead of raw `divide-x` to prevent broken border divider lines when wrapped to new rows.
   - Heavy headers/filters: use `relative sm:sticky top-0` so mobile viewports are not blocked by sticky elements consuming >25% of the screen during scrolling.
   - Floating/fixed UI (toasts, batch action toolbars, modal popups, demo widgets): clamp width using `w-[min(...,calc(100vw-2rem))]` and responsive offsets `bottom-4 right-4 sm:bottom-5 sm:right-5`.
   - Long unbroken technical strings (emails, URLs, stack traces, identifiers): always apply `break-all`.
   - Modal/card padding: use `p-4 sm:p-6` or `p-4 sm:p-8` (avoid static `p-8` or `p-10`).
   - Media player video controls: adapt with `flex-wrap sm:flex-nowrap`, preserving scrubber track width with `min-w-[120px]`.

## Versioning (SemVer - ONLY on git push to main)

- **Do NOT bump version on routine edits or local commits**: Never bump the version on routine small bugfixes or local commits to keep version numbers from unnecessarily inflating.
- **Bump ONLY when pushing to `main`**: Bump `package.json` + `package-lock.json` ONLY when the user explicitly instructs `git push` to `main` for production deployment.
- Current: **`0.8.0`**
- PATCH `0.7.0 → 0.7.1` | MINOR `0.7.x → 0.8.0` | MAJOR `0.x → 1.0.0`

## Architecture

- **Extension bridge**: Extension writes via `insert_capture_by_email` RPC (`SECURITY DEFINER`, bypasses RLS). Extension has no Supabase session.
- **Admin Supabase Monitor**: `/admin/supabase` + `/api/admin/supabase-stats` (DB size, storage, pool metrics).
- **DevTools**: `captures.dev_logs` (JSONB) → 4-tab panel + AI Clue.
- **Network 1st/3rd-party**: Relative URLs (`/api/...`) resolve against capture origin base (`new URL(url, base)`), `www.` normalized, default 1st-party.
- **DOM Replay**: `rrweb` recorded events played back in dashboard.
- **`src/lib/redact.ts`**: Server-side only - never import client-side.

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
