# AGENTS.md - BugSnap Workspace (non-Claude engines)

> `CLAUDE.md` (same directory) is canonical and holds every rule - read it. This file exists only because some engines look for `AGENTS.md` by convention; it carries no separate rule text to avoid drifting out of sync. If the two ever disagree, `CLAUDE.md` wins.
>
> **Local Commit Rule (MANDATORY for Multi-Agent Safety):** Commit locally often! Whenever a discrete task, bugfix, or feature step passes its verification gate, immediately make a local `git commit` with a clear conventional message (`fix: ...`, `feat: ...`, `refactor: ...`). NEVER leave completed changes uncommitted in the working tree-multiple concurrent agents operate on this repo and uncommitted changes will be overwritten or lost. Local commits are safe, preserve full git history/reflog, and do NOT push to remote.
>
> **Git Push Rule (STRICT):** NO auto-push without explicit instruction in that exact turn. Push to `main` applies only to repos that actually have code changes. Unchanged repos must NOT be pushed or version-bumped.
>
> **Version, Packaging & Release Rule:**
> 1. Bump version ONLY on repos with actual code changes following SemVer. If a repo has no code changes, do NOT bump its version and do NOT push it ulang.
> 2. For `bugsnap-extension` (when it has changes): Parity is strict: Chrome == Firefox == Edge (`manifest.json`, `manifest.firefox.json`, `manifest.edge.json`, `package.json`, `package-lock.json`). Package extension ZIPs (`npm run package:all`), keep only latest in `releases/`, tag `v{version}`, and create GitHub Release with SHA-256 checksums.
> 3. For `bugsnap-dashboard` (when it has changes): Bump version in `package.json` & `package-lock.json`. (Vercel-deployed, no GitHub release/ZIP needed).
> 4. For `bugsnap-mcp` (when it has changes): Bump version in `package.json` & `package-lock.json`.
> 5. Update changelogs (`CHANGELOG.md` at root and `bugsnap-dashboard/CHANGELOG.md`) for all changed projects.
> 6. Run `/graphify --update` before push.
> 7. Push changed repos to `main`.
>
> **Graphify Rule (MANDATORY):** Unified graph lives ONLY at root `graphify-out/` (never in subrepos). NEVER `read_file` on `graph.json` (4.5MB) or full `GRAPH_REPORT.md` (71KB). Pinpoint code targets instantly using CLI query (`& (Get-Content "graphify-out\.graphify_python") -m graphify query "<target>"`) before inspecting, modifying code, or spawning subagents. Strictly ban blind sweep-reading or broad directory greps. Run `/graphify --update` only before push to main.
>
> **Copy & CTA Rule (STRICT):** Never use or append the words "- Free" or "- Gratis" in CTAs, buttons, marketing banners, or page copy across all pages (use clean "Add to Chrome", "Add to Firefox", "Tambah ke Chrome", "Tambah ke Firefox").

Brand/logo rules: `BRAND.md`.
