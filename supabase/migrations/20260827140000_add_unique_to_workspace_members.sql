-- =====================================================================
-- 20260827140000_add_unique_to_workspace_members.sql
-- Adds unique index on workspace_members(workspace_id, user_id)
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_members_workspace_user
  ON public.workspace_members (workspace_id, user_id);

ALTER TABLE public.workspace_members
  DROP CONSTRAINT IF EXISTS uq_workspace_members_workspace_user;

ALTER TABLE public.workspace_members
  ADD CONSTRAINT uq_workspace_members_workspace_user
  UNIQUE USING INDEX uq_workspace_members_workspace_user;
