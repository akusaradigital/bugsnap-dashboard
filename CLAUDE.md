# CLAUDE.md — BugSnap Dashboard

> Rules for Claude Code and AI agents on `bugsnap-dashboard` (Next.js 14, Supabase, App Router).

## 1. Critical Rules

1. **Graphify MANDATORY**: Read `../graphify-out/GRAPH_REPORT.md` before opening any file.
2. **Tooling**: `PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`. No `cat`.
3. **No auto-push**: NEVER `git push` without explicit user instruction.
4. **PowerShell 5.1**: `&&` not supported — use `;` or Bash tool.
5. **Free tier stubs**: `tiers.ts` + `quota.ts` are intentionally unlimited — do NOT add paywalls.
6. **i18n MANDATORY**: All UI text via `src/lib/i18n.ts` + `useT()`. Both `en` + `id` keys. No hardcoded strings.
7. **Design**: Solid colors, Tailwind tokens, dark/light mode. No heavy gradients.
8. **Ethics**: Never compare BugSnap to competitors in UI or docs.
9. **No `any` TS type**: Use proper types. `@typescript-eslint/no-explicit-any` is enforced.

## 2. Versioning (SemVer)

Bump `package.json` + `package-lock.json` (top-level + `packages[""].version`) before every production deploy.

- **PATCH** `0.5.10 → 0.5.11`: bugfix, hotfix, copy, asset, dependency.
- **MINOR** `0.5.x → 0.6.0`: new user-facing feature, route, module.
- **MAJOR** `0.x → 1.0.0`: breaking API/auth/UI change.

Current version: **`0.5.11`**

## 3. Architecture & Data Flow

```
Extension → Supabase RPC insert_capture_by_email()  [SECURITY DEFINER]
         → tables: captures, comments, workspaces, workspace_members, capture_views
         ← Dashboard (Next.js, user session, RLS-scoped reads)
```

- **Admin Supabase Monitor**: `/admin/supabase` + `/api/admin/supabase-stats` — real-time DB size, storage, connection pool metrics.
- **DevTools**: `captures.dev_logs` (JSONB) → 4-tab panel (Console, Network, Storage, System) + AI Clue.
- **Network 1st/3rd-party**: Resolve relative URLs with `new URL(url, captureOrigin)`, normalize `www.`, default to 1st-party on error. See `isFirstPartyUrl` in `DevToolsPanel.tsx`.
- **DOM Replay**: `rrweb` events stored + played back in dashboard.
- **`src/lib/redact.ts`**: Server-side only — never import into client components.

## 4. Domain & DNS

- App: `bugsnap.akusaraproject.my.id` only (Vercel: `prj_07vmHWiKLnvJ3EacILxkznfkMIxt`).
- `dashboard.akusaraproject.my.id` → 301 redirect only, never serves app directly.
- Cloudflare: `CNAME → cname.vercel-dns.com` (proxied=false).

## 5. Security Rules

1. Never commit secrets: `.env.local`, service role keys, `sbp_*` PATs.
2. RLS must stay enforced — never widen a policy to `true` for user tables.
3. Extension has no Supabase session — always use RPCs, never direct inserts.
4. Service role key: `process.env.SUPABASE_SERVICE_ROLE_KEY` — server Route Handlers only.
5. `get_public_capture` RPC nulls `password` + `expires_at` before serving to public.
6. Supabase project: `kkmvanwgywrqsudvspge.supabase.co` (fixed).

## 6. Image & Asset Safety

- All icons/images referenced in JSX must exist in `public/`. Audit: `node tests/check-assets.js`.
- All `<img>` rendering OAuth avatars, workspace logos, or custom branding URLs **must** have `onError` fallback to initial-letter badge or `/icon.svg`. Use states: `failedAvatars`, `failedWsAvatars`, `brandLogoFailed`, `logoPreviewError`.
- `no-img-element` Next.js lint warnings are expected and suppressed via `// eslint-disable-next-line` for dynamic external URLs where `next/image` cannot be used.

## 7. Build & Test Commands

```bash
npm test           # 20+ unit & contract suites (Node test runner)
npm run build      # Production build — must exit with 0 errors
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run dev        # Local dev (HMR auto — restart only if .env.local or next.config.mjs changes)
node tests/check-assets.js  # Audit static asset paths in public/
```
