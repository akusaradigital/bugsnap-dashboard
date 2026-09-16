-- =====================================================================
-- 20260916220000_rls_supporting_indexes.sql
-- Missing indexes discovered by RLS audit:
--   1. workspaces(owner_user_id) — no index at all; used in EXISTS subqueries
--      by RLS policies on workspace_members, audit_logs, capture_views,
--      workspace_folders, workspace_settings, workspace_invites, etc.
--   2. workspace_invites(lower(email)) partial — used in ensure_user_and_workspace_by_email
--   3. capture_views(capture_id) — already present per audit (capture_views_capture_idx);
--      skip to avoid duplicate.
-- =====================================================================

-- 1. workspaces.owner_user_id — FK to auth.users, used heavily by RLS EXISTS subqueries
--    on 6+ tables. No index currently exists. Every RLS-evaluated row on those tables
--    triggers a seq scan on workspaces.
CREATE INDEX IF NOT EXISTS workspaces_owner_user_id_idx
  ON public.workspaces (owner_user_id);

-- 2. workspace_invites lower(email) partial — used in ensure_user_and_workspace_by_email
--    RPC for invite acceptance. Without this, invite lookup is a seq scan.
CREATE INDEX IF NOT EXISTS workspace_invites_email_lower_pending_idx
  ON public.workspace_invites (lower(email))
  WHERE accepted_at IS NULL;
