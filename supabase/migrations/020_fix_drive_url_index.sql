-- =====================================================================
-- 020_fix_drive_url_index.sql - T-034: align captures drive_url expression index
-- to match LOWER(TRIM(drive_url)) used in get_capture_by_drive_id RPC.
--
-- Context: 013_perf_indexes.sql & 019_capture_status_tag.sql created an
-- index on `lower(drive_url)`. However, the RPC `get_capture_by_drive_id`
-- queries using `LOWER(TRIM(drive_url)) = LOWER(TRIM(p_drive_id))`.
-- PostgreSQL expression index on `lower(drive_url)` is NOT used when
-- queries include `TRIM()`, causing unwanted Sequential Scans.
--
-- HOW TO APPLY (MANUAL - do not run from the CLI):
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
-- =====================================================================

DROP INDEX IF EXISTS public.captures_drive_url_lower_idx;

CREATE INDEX IF NOT EXISTS captures_drive_url_lower_trim_idx
  ON public.captures (lower(trim(drive_url)));
