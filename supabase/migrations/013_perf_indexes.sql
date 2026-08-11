-- =====================================================================
-- 013_perf_indexes.sql - Close the three index asymmetries (T-021 P-1)
--
-- Applies:
--   1. captures(workspace_id, folder_name) partial - folder sidebar filter
--      and the ?folder= deep link on /captures currently sequence-scan
--      (folder filtering alone can't use captures_ws_created_idx).
--   2. captures(lower(drive_url)) - content.js dedupes Drive badges via
--      LOWER(TRIM(drive_url)) = LOWER(...); that filter sequence-scans
--      today (get_capture_by_drive_id).
--   3. users(lower(email)) - the bridge resolves users by email everywhere
--      (layout plan check, captures, /v/[id], notification routes, quota);
--      Postgres turns a fixed-string ILIKE into lower(col) LIKE lower('...')
--      so this expression index serves all those lookups.
--
-- HOW TO APPLY:
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
--   No data migration, no table locks beyond the CREATE INDEX work.
-- =====================================================================

-- 1. Folder filter: workspace-led partial index (covers both the sidebar
--    query and the workspace+folder page filter in one scan).
create index if not exists captures_ws_folder_idx
  on public.captures (workspace_id, folder_name)
  where folder_name is not null;

-- 2. Drive-URL dedupe lookup (extension content.js):
create index if not exists captures_drive_url_lower_idx
  on public.captures (lower(drive_url));

-- 3. Email lookup (bridge + layout + notification routes):
create index if not exists users_email_lower_idx
  on public.users (lower(email));
