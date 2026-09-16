# CLAUDE.md - BugSnap Dashboard Rules

> Single source of truth for Claude Code and AI agents working on the **BugSnap** dashboard codebase.

## 1. System & Tool Rules (CRITICAL)

1. **Wajib Pelajari Graphify Sebelum Eksplorasi (MANDATORY)**: Seluruh arsitektur dashboard telah dipetakan di `../graphify-out/GRAPH_REPORT.md` (dan `manifest.json`). AI agent **WAJIB** membaca laporan Graphify tersebut terlebih dahulu untuk menavigasi modul App Router, route handlers (`src/app/api/...`), komponen UI, library hooks (`useT()`, Supabase client), serta RPC database sebelum membuka file. Dilarang membaca ulang seluruh file (*blind re-reading*) secara massal jika lokasinya sudah dipetakan di Graphify.
2. **Tooling Standards**: Use officially declared tools (`PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`). Never call legacy or nonexistent tool names (`Bash_ide`, `Agent_ide`, etc.).
3. **Do NOT use shell command `cat`** to read files. Always use the dedicated `Read` tool.
4. **NEVER run `git push`** unless the user explicitly asks in that exact turn.
5. **Platform Windows 11 / PowerShell 5.1**: In PowerShell 5.1, the pipeline chaining operator `&&` causes a syntax error. Use `;` for sequential commands or use POSIX Bash.
6. **Development Server**: Next.js 14 App Router provides automatic HMR. Only restart the dev server process if `.env.local` changes, `next.config.mjs` changes, or if the process becomes unresponsive.
7. **Product & Monetization ("BugSnap Tetap Free Dulu")**: All entitlement checks in `src/lib/tiers.ts` and `src/lib/quota.ts` are deliberately stubbed to return `true` / `unlimited`. Do NOT "fix" these stubs or add feature gating / paywalls unless explicitly instructed by the user.
8. **Wajib Pake i18n**: Seluruh teks antarmuka, label form, pesan status, modal, banner, dan komponen UI di BugSnap **WAJIB** menggunakan sistem i18n (`src/lib/i18n.ts`, `I18nProvider`, `useT()`). Bahasa harus otomatis mendeteksi locale browser pengguna (`navigator.language.startsWith('id')` → `"id"`, selain itu `"en"`), atau mengikuti preferensi bahasa yang disimpan (`BugSnap.locale`). Setiap penambahan key baru harus disertakan pada kamus `en` dan `id`. Dilarang menulis teks UI langsung (*hardcoded string*).
9. **Etika Produk & Desain**: Dilarang keras membanding-bandingkan produk dengan kompetitor di UI atau dokumentasi publik. Gunakan warna solid (tanpa gradient berlebihan), bersih, konsisten dengan token Tailwind, dan mendukung mode gelap/terang.

## 2. Versioning (SemVer - bump before every production deploy)

- **Semantic Versioning**: `MAJOR.MINOR.PATCH`. Bump is REQUIRED whenever changes are about to ship to production.
  - **MAJOR**: breaking change (API schema break, breaking auth, breaking UI flow). E.g. `0.2.0` → `1.0.0`.
  - **MINOR**: new user-facing feature (new route, new module, new integration). E.g. `0.5.0` → `0.6.0`.
  - **PATCH**: bugfix, hotfix, copy update, dependency bump. E.g. `0.5.7` → `0.5.8`.
- Version lives in `package.json` (+ sync `package-lock.json` top-level `version` and `packages[""].version`).

## 3. Architecture & Data Flow

```
Extension (capture → Google Drive upload)
   │  anon key + email (from chrome.storage.local "user_email")
   ▼
   Supabase RPC: insert_capture_by_email(...)   ← SECURITY DEFINER, bypasses RLS
   │
   ▼
   tables: captures, comments, workspaces, workspace_members, workspace_settings, capture_views
   ▲
   Dashboard (Next.js, Supabase client with user session, RLS-scoped reads)
```

- **Key bridge (email-link)**: The extension has no Supabase session. It inserts captures via the RPC `insert_capture_by_email` (`SECURITY DEFINER`), which resolves the user by email and links the capture to their workspace.
- **DevTools & AI Clue**: The `captures.dev_logs` (JSONB) column stores Console logs, Network requests, Storage keys, and System info. Dashboard displays these in a 4-tab DevTools inspector and feeds them to the AI Root Cause Clue analyzer.
- **DOM Replay**: Session replay payloads recorded via `rrweb` are rendered using the dashboard's DOM replay player.

## 4. Domain & DNS (SINGLE SOURCE OF TRUTH)

- **THE ONLY domain that may SERVE the BugSnap app is `bugsnap.akusaraproject.my.id`** - no other subdomain (no `app.*`, no `www.*`) may serve the app.
- **`dashboard.akusaraproject.my.id` is allowed ONLY as a 301 redirect alias** → `bugsnap.akusaraproject.my.id`. It must NEVER serve the app directly.
- Vercel project: `bugsnap` (`prj_07vmHWiKLnvJ3EacILxkznfkMIxt`) - production deploy = `vercel deploy --prod`.
- Cloudflare DNS: `CNAME bugsnap.akusaraproject.my.id → cname.vercel-dns.com` (proxied=false).

## 5. Security & Credential Rules (ENFORCED)

1. **NEVER commit secrets**: `.env.local`, Supabase service role keys, Google client secrets, `sbp_*` PATs. All are gitignored.
2. **RLS must stay enforced**: Never widen a policy to `true` for tables containing user data.
3. **Extension has no Supabase session**: Always go through RPCs, never direct table inserts from the extension.
4. **Keep the design system**: Tailwind tokens `bg-background`, `text-foreground`, `text-muted`, `border-border`, `bg-subtle`, `bg-indigo-600`, `bg-emerald-400`, white cards.
5. **Never hardcode environment-specific values**: Use `process.env` in dashboard and `CONFIG` in extension.
6. **Password & expires_at never leave the server**: Public share pages go through `get_public_capture` RPC which nulls sensitive fields when locked/expired.
7. **Service role key is server-only**: Only in `process.env.SUPABASE_SERVICE_ROLE_KEY` on server side (Route Handlers / Server Actions). Never expose to client components.
8. **Build must pass clean before every push**: `npm run build` must have zero errors and zero warnings.
9. **No `any` type in TypeScript**: Use proper types or interfaces. `@typescript-eslint/no-explicit-any` is enforced.
10. **Supabase project is fixed**: `kkmvanwgywrqsudvspge.supabase.co`.

## 6. Build & Test Commands

- Run test suite: `npm test` (executes 19 unit and contract suites via Node test runner)
- Run production build: `npm run build`
- Run linter: `npm run lint`
- Run TypeScript type check: `npm run typecheck`
- Run local dev server: `npm run dev`
