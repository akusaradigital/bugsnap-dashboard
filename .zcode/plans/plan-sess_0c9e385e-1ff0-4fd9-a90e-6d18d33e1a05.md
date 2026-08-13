Minimal next step: move the console/network/actions normalization closer to the capture producer path, but keep the dashboard-compatible shape and avoid any server-heavy processing.

What I confirmed
- `src/components/DevToolsPanel.tsx` can already render `console`, `network`, `step`, `navigation`, and `screenshot` entries.
- `src/app/api/ai-bug-summary/route.ts` and the capture notification route already accept either a raw log array or a compact summary object.
- `supabase` schema stores `dev_logs` as JSONB, so no DB migration is required for a minimal schema-compatible change.
- The repo search did not immediately surface the producer code in the dashboard tree, so the likely source of truth is the extension repo / upload flow, not the dashboard pages.

Approved implementation approach
1. Keep the existing dashboard viewer logic and compatibility for old captures.
2. Add or update the capture producer to emit a normalized event array with these shapes:
   - console: `{ type: "console", level, message, stack?, time?/timestamp?, count? }`
   - network: `{ type: "network", method, status, url, statusText?, duration?, requestBody?, responseBody?, error?, time?/timestamp?, count? }`
   - actions: `{ type: "step" | "navigation" | "screenshot", message, url?, time?/timestamp?, count? }`
3. Preserve the existing compact summary object for lightweight captures if the producer already uses it.
4. Do not add new server processing; just standardize what gets written into `dev_logs` before insert/upload.
5. Keep the dashboard’s normalization fallback so legacy captures still render.

Files likely to touch
- Extension/upload producer file(s) that build `p_dev_logs` for `insert_capture_by_email`
- Optional small follow-up in `src/components/DevToolsPanel.tsx` only if the new event shape needs a tiny rendering tweak
- No Supabase migration needed for this minimal step

Why this is still minimal
- No new tables
- No heavy server jobs
- No video OCR/frame parsing
- No HAR storage
- Just cleaner JSON emitted at the source

Lazier alternative: leave producer untouched and keep only dashboard-side normalization. That is less work now, but it leaves inconsistent data in storage and makes the next feature harder.

[code] → skipped: [server-side log enrichment and media analysis], add when [you need AI correlation or jump-to-frame debugging].