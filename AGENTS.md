# AGENTS.md - BugSnap Dashboard Rules

> Quick reference for AI agents working on `bugsnap-dashboard`.

## Critical Rules

1. **Graphify MANDATORY**: Read `../graphify-out/GRAPH_REPORT.md` before touching code. No sweep-reading. Use latest graph data only; old snapshots in `../graphify-out/<old-date>/` are purged on update.
2. **Tools**: Use `PowerShell`/`Bash`, `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Agent`. No `cat`.
3. **No auto-push**: NEVER `git push` without explicit instruction. Before executing `git push`, run `/graphify --update`.
4. **PowerShell 5.1**: No `&&` - use `;` or Bash tool.
5. **Free tier stubs**: `tiers.ts` + `quota.ts` are deliberately unlimited. Do NOT add paywalls.
6. **i18n**: All UI text via `src/lib/i18n.ts` + `useT()`. Both `en` + `id`. No hardcoded strings.
7. **No `any` TS type**: Proper types only.
8. **Icon Standard (Iconify)**: Use Iconify (https://iconify.design/getting-started/) for all icons for uniformity and consistency (`@iconify/react` via `<Icon icon="..." />`). Avoid mixing different icon libraries or manual inline SVGs without standardization. Use `src/lib/icons.ts` as the shared registry for reusable navigation/action/status icons; keep route and shortcut icons in sync and run `tests/icons.test.mjs`. Use third-party logos only when the represented vendor is the subject, preserve the original vendored artwork in `src/lib/third-party-logos.json`, and register/render it through `src/lib/iconify.ts`. Do not add decorative imagery when existing UI communicates the content. BugSnap logo source artwork is immutable; use only the approved `public/bugsnap-*.svg` variant appropriate to the background, preserving its aspect ratio and clear space.
   - UI/menu icons must describe the actual action, section, or data they represent; do not use browser/vendor logos as generic feature or navigation icons.
   - Apply BugSnap theme through existing semantic/Tailwind tokens and preserve readable contrast in light and dark themes. Keep genuine third-party product logos only where that product is the subject, using the approved original artwork without recoloring or distortion.
   - BugSnap's own logo is immutable: never redraw, recolor, reshape, crop, distort, add effects to, or otherwise modify its source artwork. Use the original approved asset proportionally with clear space. When auditing or changing other visuals, explicitly exclude the BugSnap logo from edits.
9. **Color system**: Use BugSnap green (`#89BD49`, hover `#6B9A35`) for primary extension/store CTAs and success/available pills; use BugSnap blue (`#2563EB` / `#3B82F6`) for dashboard navigation, settings, and neutral action buttons; reserve red/rose exclusively for destructive actions, genuine errors, recording indicators, and danger states; use amber only for warnings. Do not use red, purple, or arbitrary accent colors for generic branding, pills, or primary actions.
10. **Broken visual assets**: Every Iconify identifier must map to an existing offline SVG in `public/icons/`; every static image path must exist; dynamic images must have an `onError` fallback. Never ship a broken-image placeholder or an error screen caused by a missing chunk/asset. After UI changes, run the asset/icon integrity tests and verify the affected route in the local browser.
11. **DB changes apply immediately**: A new `supabase/migrations/*.sql` is not done until it runs against the live project. Execute it with `node scripts/apply-migration.mjs <file.sql>` (Management API + `SUPABASE_PAT` from `.env.local`) in the same turn it is written. Snapshot what you are replacing first - `--sql "select pg_get_functiondef(...)"` - and verify afterwards. Never leave a migration written-but-unapplied.
10. **Mobile View 360px–440px Audit (MANDATORY on Dashboard Changes)**: For every UI, component, or page change in `bugsnap-dashboard`, you MUST verify and audit responsiveness across small mobile viewports (360px–440px, usable width ~328px with 16px horizontal gutters). Horizontal overflow/scrolling is strictly forbidden. Mandatory rules:
   - Add `min-w-0` to flex child containers to allow nested `truncate` elements to truncate properly without overflowing.
   - Responsive grids: convert desktop multi-column grids (`grid-cols-2/3/4`) to `grid-cols-1 sm:grid-cols-2/3`, and use `gap-6 sm:gap-0 sm:divide-x` instead of raw `divide-x` to prevent broken border divider lines when wrapped to new rows.
   - Heavy headers/filters: use `relative sm:sticky top-0` so mobile viewports are not blocked by sticky elements consuming >25% of the screen during scrolling.
   - Floating/fixed UI (toasts, batch action toolbars, modal popups, demo widgets): clamp width using `w-[min(...,calc(100vw-2rem))]` and responsive offsets `bottom-4 right-4 sm:bottom-5 sm:right-5`.
   - Long unbroken technical strings (emails, URLs, stack traces, identifiers): always apply `break-all`.
   - Modal/card padding: use `p-4 sm:p-6` or `p-4 sm:p-8` (avoid static `p-8` or `p-10`).
   - Media player video controls: adapt with `flex-wrap sm:flex-nowrap`, preserving scrubber track width with `min-w-[120px]`.
11. **Real Website Testing Standard (MANDATORY)**: For all E2E, Playwright, and browser automation tests, you MUST use REAL production websites from the public internet that match the specific technical characteristics of the test case. Arbitrary mock injections or lazily reusing a single URL (e.g. Wikipedia only) across different test cases is strictly forbidden. Examples: CSP blocking (`https://github.com`), infinite scroll (`https://infinite-scroll.com/demo/full-page/`), Shadow DOM (`https://shoelace.style`), sticky header/nav overlay (`https://vuejs.org`).
12. **NO THIRD-PARTY BRAND/MERK NAMES (STRICT MANDATORY)**: NEVER use, mention, or reference competitor brand names (e.g. Jam, Jam.dev, Loom, GoFullPage, Marker.io, etc.) anywhere in website text, UI labels, marketing copy, code comments, filenames, test suites, or documentation. All architecture, algorithms, and features must be named purely using BugSnap's own brand and native technical terminology. Never compare BugSnap to competitors in UI or docs.
13. **Changelog Generation (`CHANGELOG.md`) on Release (MANDATORY on git push to main)**: Whenever the user explicitly instructs `git push` to `main` (release/deploy time), ALWAYS generate and update release entries in `CHANGELOG.md` (both workspace root `../CHANGELOG.md` and `bugsnap-dashboard/CHANGELOG.md`, kept strictly synchronized) covering all 3 projects (`[bugsnap-dashboard]`, `[bugsnap-extension]`, `[bugsnap-mcp]`). This directly feeds `/admin/changelog`.
14. **Focused validation**: For a dashboard-only change, run the smallest affected validation first (`npm run typecheck`, targeted tests, and `npm run lint` for JSX/TSX). Do not run unrelated extension or MCP suites. Use the full dashboard gate (`npm run typecheck && npm test && npm run build`, plus `npm run lint` for JSX/TSX) for release/commit validation or explicit full validation.
15. **Subagent-per-module**: Delegate only the affected dashboard route/component/module and provide the relevant Graphify call map before asking a subagent to inspect code.
16. **Real browser and mobile validation**: For UI/E2E changes, use the configured real browser and real public website appropriate to the scenario. Audit 360px–440px layouts with zero horizontal overflow.

## Versioning (SemVer - ONLY on git push to main)

- **Do NOT bump version on routine edits or local commits**: Never bump the version on routine small bugfixes or local commits to keep version numbers from unnecessarily inflating.
- **Bump ONLY when pushing to `main`**: Bump `package.json` + `package-lock.json` ONLY when the user explicitly instructs `git push` to `main` for production deployment.
- **Release Sequence on git push to main**: bump version -> generate/update `CHANGELOG.md` for all 3 projects -> gate (`npm run typecheck && npm test && npm run build`) -> `/graphify --update` -> commit -> `git push origin main`.
- **CI auto-tags every push to `main`, independent of release intent**: the CI `Auto-tag Release` step tags `v{package.json version}` on every push to `main` (not only release pushes) if that tag doesn't exist yet, without bumping the version itself. Harmless — this repo is Vercel-deployed and never gets a manual GitHub Release.
- Current: **`0.14.2`**
- PATCH `0.7.0  0.7.1` | MINOR `0.7.x  0.8.0` | MAJOR `0.x  1.0.0`

## Architecture

- **Extension bridge**: Extension writes via `insert_capture_by_email` RPC (`SECURITY DEFINER`, bypasses RLS). Extension has no Supabase session.
- **Admin Supabase Monitor**: `/admin/supabase` + `/api/admin/supabase-stats` (DB size, storage, pool metrics).
- **DevTools**: `captures.dev_logs` (JSONB)  4-tab panel + AI Clue.
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

## Brand Asset & Visual Identity Enforcement

**Goal**: Ensure all image generation, visual design, illustrations, marketing content, banners, posters, thumbnails, social media assets, and other visual deliverables strictly adhere to the brand identity.

### 1. Mandatory Brand Colors
- Use official brand colors specified in brand assets as the primary reference whenever generating images.
- All colors used must strictly adhere to the official brand color palette.
- Do not alter, replace color hex codes, or introduce arbitrary new colors inconsistent with the brand identity.
- Accent colors are permitted only when genuinely required for secondary elements and must remain harmonious with the brand identity.
- Never use gradients unless explicitly permitted by brand guidelines.

### 2. Logo Integrity — Strict Rule
- Use the original logo from brand assets as the single source of truth.
- The logo must be preserved 100% identical to its source file.
- Modifying the logo shape, proportions, structure, color, typography, composition, or details is strictly forbidden.
- Recreating, redrawing, modifying, stylizing, or reinterpreting the logo using AI is strictly forbidden.
- Do not add effects, gradients, drop shadows, outlines, glows, or decorative elements to the logo.
- Do not crop, stretch, skew, or distort the logo.
- Ensure the logo is always clearly visible, proportional, with sufficient clear space.
- If image generation cannot render the logo accurately, composite or overlay the original high-resolution logo onto the final generated image.

### 3. Image Generation Requirements
Whenever creating visual assets for any requirement:
- Use brand assets as the primary visual reference.
- Consistently apply brand colors across backgrounds, objects, graphic elements, typography, and accents.
- Preserve the brand's visual character and identity.
- Ensure designs appear professional, clean, modern, and aligned with brand guidelines.
- Never generate generic designs that ignore brand identity.
- Never use colors or visual trademarks belonging to other brands.

### 4. Brand Asset Priority
The strict hierarchy of visual references:
1. Original brand logo.
2. Official brand color palette.
3. Official typography.
4. Existing brand guidelines.
5. Existing approved visual assets.

Never make assumptions or invent a new visual identity when official references are provided.

### 5. Mandatory Rules for AI Agents
- These rules apply to all AI agents, subagents, image generation tools, design tools, and automation workflows.
- Every agent must review and adhere to brand rules prior to executing any visual task.
- Ensure `AGENTS.md` and `CLAUDE.md` maintain synchronized rules.
- Never delete or override existing instructions in either file.
- Integrate these rules as part of permanent project instructions.

### 6. Final Quality Check
Before completing any visual task, verify:
- [ ] Colors match the official brand palette.
- [ ] Logo uses the original file without modifications.
- [ ] No distortion or proportional warping of the logo.
- [ ] No visual elements conflict with brand identity.
- [ ] Final output is consistent with approved brand visual assets.

**NON-NEGOTIABLE:** Brand consistency is mandatory. No image generation or visual design task may disregard brand identity. The logo must never be altered under any circumstance.

