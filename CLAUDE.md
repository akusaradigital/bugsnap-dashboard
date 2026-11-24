# CLAUDE.md - BugSnap Workspace

> Canonical rules across `bugsnap-dashboard`, `bugsnap-extension`, `bugsnap-mcp`. Each repo's own `CLAUDE.md` holds only what's specific to that repo and links back here for anything cross-repo. `AGENTS.md` (root + per-repo) is a short pointer for non-Claude engines - if they disagree, this file wins.
> Brand/logo rules live in `BRAND.md` - do not duplicate them here.

## 1. Git & Push

1. **Local Commit Discipline (MANDATORY for Multi-Agent Safety)**:
   - Commit locally often! Whenever an individual task, bugfix, or feature step passes its verification gate (§4), **immediately make a local `git commit`** with a descriptive conventional message (`fix(...)`, `feat(...)`, `refactor(...)`).
   - Do NOT leave completed changes uncommitted in the working tree. Multiple AI agents (Claude Code, Antigravity, Cursor, etc.) work on this workspace; uncommitted in-flight files risk being clobbered, reverted, or overwritten. Local commits preserve full history and rollback capability.
2. **No auto-push**: never `git push` without explicit instruction in that exact turn. Local commits are safe and encouraged; remote pushes are guarded.
3. **Push to `main` = Production Release for Changed Repos**:
   When instructed to push to `main`:
   - **Bump version ONLY on repos with code changes**: Naik version HANYA jika ada perubahan kode pada repo/komponen tersebut. Jika tidak ada perubahan kode pada suatu repo, versinya JANGAN dinaikkan dan TIDAK perlu di-push ulang.
   - For `bugsnap-extension` (when it has changes): Manifest version parity is strict: Chrome == Firefox == Edge (`manifest.json`, `manifest.firefox.json`, `manifest.edge.json`, `package.json`, `package-lock.json`). Package extension ZIPs (`npm run package:all`), keep only latest in `releases/`, tag `v{version}`, and create GitHub Release with SHA-256 checksums.
   - For `bugsnap-dashboard` (when it has changes): Bump version in its `package.json` & `package-lock.json`. It is Vercel-deployed and does not require GitHub Release or extension ZIPs.
   - For `bugsnap-mcp` (when it has changes): Bump version in its `package.json` & `package-lock.json`.
   - Update changelogs (`CHANGELOG.md` at root and `bugsnap-dashboard/CHANGELOG.md`) for all changed projects.
   - Run verification gates (§4) on the changed repos.
   - Run Graphify update: `/graphify --update` (see §3) before pushing to `main`.
   - Push changed repos to `origin main`. Unchanged repos without code modifications must NOT be pushed or version-bumped redundantly.
4. **Pre-push gate is enforced by git itself**: each repo has a tracked `.githooks/pre-push` (wired via `core.hooksPath`, activated by the `prepare` npm script) that runs that repo's verification gate (§4) before any push to `main` and blocks the push on failure. Bypass only with `git push --no-verify`, deliberately.
5. `bugsnap-dashboard`'s CI does **not** auto-tag on push (removed 2026-11-10, along with 21 stale no-asset tags it had created) - tag/release that repo manually only if asked; it's Vercel-deployed and was never meant to carry GitHub Releases.

## 2. Versioning & Releases

### Production Release Workflow (MANDATORY on Every Push to main)
- **Bump versions**: Bump version across all affected components (`package.json`, `package-lock.json`, and all extension manifests) following SemVer (PATCH for fixes/assets, MINOR for features/routes, MAJOR for breaking changes).
- **Version parity**: The extension's `manifest.json`, `manifest.firefox.json`, `manifest.edge.json`, `package.json`, and `package-lock.json` must always remain identical in version. Chrome == Firefox == Edge, always.
- **Update changelogs**: Add aggregated entries to root `CHANGELOG.md` and `bugsnap-dashboard/CHANGELOG.md` summarizing all commits since the previous release. Format: `## [project-name]` / `### YYYY-MM-DD (vX.Y.Z)` / `**feat**:`/`**fix**:`/`**perf**:`/`**docs**:`/`**chore**:`.
- **Extension ZIP packaging**: Run `npm run package:all` to produce `BugSnap-v{version}-google-chrome.zip`, `BugSnap-v{version}-mozilla-firefox.zip`, and `BugSnap-v{version}-microsoft-edge.zip`.
- **Run verification gates**: Ensure all verification gates pass (§4).
- **Run Graphify**: `/graphify --update` before pushing to `main` (see §3).
- **Pushes to `main` are all three together**: `bugsnap-dashboard`, `bugsnap-extension`, and `bugsnap-mcp` are pushed as one set, and nothing may be left unpushed locally.
- **GitHub Release = extension only**: tag `v{version}` (annotated) on the pushed commit, then `gh release create v{version} --repo akusaradigital/bugsnap-extension --notes-file <notes> <chrome.zip> <firefox.zip> <edge.zip>` with the 3 SHA-256 checksums in the notes. `bugsnap-dashboard` never gets a Release (Vercel-deployed); `bugsnap-mcp` gets a tag only if asked, never assets.
  - Never tag before pushing, never tag a commit not on `origin/main`, never attach source/secrets/test output, never make the repo public to share a Release.
  - Wrong Release? Delete it and its tag (`gh release delete v{version} --cleanup-tag`), redo from a verified tree. Never move an already-pushed tag.
- **Extension ZIP packaging rules**: POSIX forward slashes only (never `Compress-Archive` - backslashes get rejected by AMO). Strict per-browser isolation: Firefox excludes `offscreen.*`/Chromium-only permissions; Edge strips `key`/Gecko settings; Chrome strips Firefox/Edge vendor settings. Never distribute raw source or ask users to enable Developer Mode - official stores only.
- On Mozilla Add-ons, upload only `releases/mozilla-firefox/BugSnap-v{version}-mozilla-firefox.zip`; never upload the Chrome or Edge ZIP.
- **Release ZIP retention**: Keep ONLY the latest release ZIPs per browser in `releases/` (Chrome, Firefox, Edge). Older version ZIPs must be pruned locally so `releases/` remains lean and does not accumulate bloat.

## 3. Graphify (MANDATORY)

- **Single Source of Truth**: Graphify is maintained ONLY at the root (`graphify-out/`), encompassing `bugsnap-dashboard`, `bugsnap-extension`, and `bugsnap-mcp`. Never create or maintain separate `graphify-out` directories inside individual sub-projects.
- **Zero Raw File Dumps (STRICT)**: NEVER attempt `read_file` on `graphify-out/graph.json` (4.5MB), `manifest.json`, or the entire `GRAPH_REPORT.md` (71KB). Reading raw mega-files wastes 20k-100k tokens and causes agent truncation.
- **Pinpoint via CLI Query**: Always locate targets using the Graphify CLI query before inspecting or modifying code:
  - PowerShell / non-Claude: `& (Get-Content "graphify-out\.graphify_python") -m graphify query "<target>"`
  - This returns exact file paths, line numbers (`loc=Lxx`), and community groups in < 100 tokens.
- **When to check `GRAPH_REPORT.md`**: Only read the top navigation block (`Community Hubs`, lines 1-60) of `graphify-out/GRAPH_REPORT.md` if the target architecture or module name is completely unknown. Never read the full report.
- **Subagent Rule (STRICT)**: Query the graph yourself (`graphify query "<target>"`) before spawning a subagent; paste the exact call map / file:line locations into its prompt instead of letting it sweep-read large files.
- **Strict Ban on Sweep-Reading**: NEVER spawn a subagent with broad/open-ended instructions that cause it to blindly grep, scan random directories, or sweep-read large files. Go straight to the pinpointed nodes using the knowledge graph.
- **Update Cadence**: Run graphify update (`/graphify --update` or `& (Get-Content "graphify-out\.graphify_python") -m graphify update .`) ONLY before pushing to `main` as part of the release workflow, or when adding/removing files. Do NOT update graphify on routine line-by-line edits.
- Keep only the latest snapshot (`graphify-out/graph.json` / `graphify-out/<latest-date>/`) - older dated snapshot folders must be pruned.

## 4. Verification Gates (run before saying "done")

| Repo | Gate |
|---|---|
| `bugsnap-dashboard` | `npm run typecheck && npm test && npm run build` (+ `npm run lint` for JSX/TSX) |
| `bugsnap-extension` | `npm run test:all` + `node --check <file.js>` on every edited file |
| `bugsnap-mcp` | `npm run build` (tsc) must exit 0 - no test suite yet, say so explicitly |

## 5. Testing Standard

- E2E/Playwright/browser automation must hit **real public websites** matching the scenario - never synthetic mocks, never lazy reuse of one URL for unrelated cases.
- CSP/frame-blocking -> `github.com`/`twitter.com`. Infinite scroll -> `infinite-scroll.com/demo/full-page/`. Shadow DOM -> `shoelace.style`/`lit.dev`. Sticky nav -> `vuejs.org`/`tailwindcss.com`. Cross-origin iframes -> `httpbin.org/html`. Dense text -> Wikipedia/MDN.

## 6. Cross-Cutting Product Rules

- **Tooling**: `PowerShell`/`Bash`, `Read`/`Edit`/`Write`/`Grep`/`Glob`. No `cat`. PowerShell 5.1 has no `&&` - use `;` or the Bash tool.
- **IDE Save Conflicts (Buffer vs Disk)**: When agents edit files on disk while open in the user's IDE, VS Code / Antigravity IDE may prompt "Failed to save: The content of the file is newer". NEVER click "Overwrite" (it reverts agent edits). Always use `File: Revert File` or close the tab without saving so the editor reloads from disk.
- **Free tier stubs** (`tiers.ts`, `quota.ts`) are intentionally unlimited - do not add paywalls.
- **Mobile layout** triggers only at `window.innerWidth <= 768` - never capture dimensions.
- **Dashboard mobile audit (360-440px, MANDATORY on UI changes)**: zero horizontal overflow. `min-w-0` on flex children for truncation; `grid-cols-1 sm:grid-cols-2/3` instead of fixed desktop grids; `gap-6 sm:gap-0 sm:divide-x` instead of raw `divide-x`; `relative sm:sticky top-0` on tall headers; floating UI clamped with `w-[min(...,calc(100vw-2rem))]`; `break-all` on long technical strings; `p-4 sm:p-6/8` instead of static padding; video controls `flex-wrap sm:flex-nowrap`.
- **No "- Free" / "- Gratis" in CTAs or Page Copy (STRICT)**: Never append or use "- Free" or "- Gratis" on buttons, CTAs, marketing banners, or page headers across all pages. Use clean phrasing: "Add to Chrome", "Add to Firefox", "Tambah ke Chrome", "Tambah ke Firefox".
- **Design**: solid colors, Tailwind tokens, dark/light mode, no heavy gradients. Color system in `BRAND.md`.
- **Icons**: Iconify only (`@iconify/react`, `<Icon icon="..."/>`) - no mixed libraries, no ad-hoc inline SVGs. Every identifier must resolve to an offline SVG; every static/dynamic image needs a real path or `onError` fallback. Never ship a broken-image state.
- **No competitor comparisons or brand names** anywhere in UI, docs, code, filenames, or tests.
- **i18n**: dashboard via `src/lib/i18n.ts` + `useT()` (`en`+`id` both required, no hardcoded strings); extension via Chrome i18n (`_locales/en|id/messages.json`) - never mix the two.
- **DB migrations apply immediately**: a new `bugsnap-dashboard/supabase/migrations/*.sql` must run against the live project in the same turn it's written (`node scripts/apply-migration.mjs <file.sql>`), snapshot-first, verified-after. Never leave one written-but-unapplied.
- **Extension permissions stay least-privilege** - flag any new broad permission to the user before adding it (Chrome Web Store review risk).
- **Captures are sensitive data** (PII, tokens, secrets). Only `redact.ts` (server) / `redact.js` (extension) may redact - never bypass. No retention/expiry policy exists; never invent one unilaterally.
- **`insert_capture_by_email` RPC** is `SECURITY DEFINER`, no-session, RLS-bypassing - the one unauthenticated write path. Preserve its validation/rate-limiting; never loosen it casually.

## 7. Architecture

```
Extension (capture) -> Google Drive
                     -> Supabase RPC insert_capture_by_email() [SECURITY DEFINER, bypasses RLS]
                        tables: captures, comments, workspaces, workspace_members, capture_views
                     <- Dashboard (Next.js, Supabase session, RLS-scoped reads)
```

- DevTools telemetry: console errors + network 4xx/5xx + storage + system info -> `captures.dev_logs` (JSONB) -> 4-tab DevTools panel + AI Clue.
- `log_dev_event` gated to `sender.tab.id === diagnosticSessionTabId`; `log_dev_snapshot` uses a `pendingTabId` set before flush so teardown doesn't drop final logs.
- Relative URLs (`/api/...`) are always 1st-party: resolve with `new URL(url, captureOrigin)`, normalize `www.`, default to 1st-party on failure.
- DOM Replay: `rrweb` event streams, stored and played back in the dashboard player.

## 8. Domain

- Only `bugsnap.akusaraproject.my.id` serves the app. `dashboard.akusaraproject.my.id` is a 301 redirect only.

## 9. bugsnap-mcp

- Standalone repo `akusaradigital/bugsnap-mcp` (`@modelcontextprotocol/sdk`, stdio transport), read-only access to BugSnap captures for AI coding agents.
- Auth: read-scoped `BUGSNAP_API_KEY=bugsnap_...` only - never service-role keys or bundled secrets.
- Tool surface: read/query only (`bugsnap_list_captures`, `bugsnap_get_capture`, `bugsnap://...` resources, `bugsnap_fix_bug`/`bugsnap_triage_open_bugs` prompts). Never add delete/mutate/billing tools.
