-- =====================================================================
-- 019_capture_status_tag.sql - T-026: add the two columns the app reads
-- and writes on captures but NO migration ever defined.
--
-- src/app/(app)/captures/page.tsx selects tag/status and its edit modal
-- writes them; /v/[id] does the same. 014's anon column grant and 013's
-- folder index both reference them. Without this file every edit save
-- and the 014 grant 42703.
--
-- ALSO repairs two columns 007 was meant to add but never reached
-- (007 failed mid-script on a policy error before these lines ran):
--   * captures.folder_name
--   * captures.site_url (exists via 009, included for idempotency)
--
-- HOW TO APPLY (MANUAL - do not run from the CLI):
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
-- =====================================================================

alter table public.captures
  add column if not exists tag    text,
  add column if not exists status text not null default 'open',
  add column if not exists folder_name text,
  add column if not exists site_url text;

create index if not exists captures_ws_folder_idx
  on public.captures (workspace_id, folder_name)
  where folder_name is not null;

create index if not exists captures_drive_url_lower_idx
  on public.captures (lower(drive_url));

create index if not exists captures_site_url_idx
  on public.captures (site_url);
