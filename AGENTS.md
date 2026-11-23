# AGENTS.md - BugSnap Workspace (non-Claude engines)

> `CLAUDE.md` (same directory) is canonical and holds every rule - read it. This file exists only because some engines look for `AGENTS.md` by convention; it carries no separate rule text to avoid drifting out of sync. If the two ever disagree, `CLAUDE.md` wins.
>
> **Local Commit Rule (MANDATORY for Multi-Agent Safety):** Commit locally often! Whenever a discrete task, bugfix, or feature step passes its verification gate, immediately make a local `git commit` with a clear conventional message (`fix: ...`, `feat: ...`, `refactor: ...`). NEVER leave completed changes uncommitted in the working tree—multiple concurrent agents operate on this repo and uncommitted changes will be overwritten or lost. Local commits are safe, preserve full git history/reflog, and do NOT push to remote.
>
> **Git Push Rule (STRICT):** NO auto-push without explicit instruction in that exact turn. Push to `main` must include all three repos together.
>
> **Version, Packaging & Release Rule (MANDATORY on Every Push to main):** Every push to `main` is treated as a production release! Whenever pushing to `main`, you MUST ALWAYS execute the full release workflow in order:
> 1. Bump version across `package.json`, `package-lock.json`, and all extension manifests (`manifest.json`, `manifest.firefox.json`, `manifest.edge.json`) following SemVer. Parity is strict: Chrome == Firefox == Edge.
> 2. Update changelogs (`CHANGELOG.md` at root and `bugsnap-dashboard/CHANGELOG.md`).
> 3. Package extension ZIPs (`npm run package:all`) and prune older versions in `releases/` (keep only latest per browser).
> 4. Run `/graphify --update` before push.
> 5. Push all three repos (`bugsnap-dashboard`, `bugsnap-extension`, `bugsnap-mcp`) together.
> 6. Create annotated git tag `v{version}` and publish GitHub Release (`gh release create v{version}`) attaching the 3 ZIP files with their SHA-256 checksums in the release notes.
> Never push to `main` without completing this full release lifecycle!
>
> **Graphify Rule (MANDATORY):** Unified graph lives ONLY at root `graphify-out/` (never in subrepos). NEVER `read_file` on `graph.json` (4.5MB) or full `GRAPH_REPORT.md` (71KB). Pinpoint code targets instantly using CLI query (`& (Get-Content "graphify-out\.graphify_python") -m graphify query "<target>"`) before inspecting, modifying code, or spawning subagents. Strictly ban blind sweep-reading or broad directory greps. Run `/graphify --update` only before push to main.
>
> **Copy & CTA Rule (STRICT):** Never use or append the words "- Free" or "- Gratis" in CTAs, buttons, marketing banners, or page copy across all pages (use clean "Add to Chrome", "Add to Firefox", "Tambah ke Chrome", "Tambah ke Firefox").

Brand/logo rules: `BRAND.md`.
