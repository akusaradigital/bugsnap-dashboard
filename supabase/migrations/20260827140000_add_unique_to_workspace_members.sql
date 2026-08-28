-- =====================================================================
-- 20260827140000_add_unique_to_workspace_members.sql
-- Adds unique index on workspace_members(workspace_id, user_id)
-- =====================================================================

-- ponytail: idempotent against a prior manual apply — only (re)create the
-- constraint when it isn't already the correct unique constraint, so a
-- retry never drops a live index it can't rebuild from.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.workspace_members'::regclass
      AND conname = 'uq_workspace_members_workspace_user'
      AND contype = 'u'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_members_workspace_user
      ON public.workspace_members (workspace_id, user_id);

    ALTER TABLE public.workspace_members
      ADD CONSTRAINT uq_workspace_members_workspace_user
      UNIQUE USING INDEX uq_workspace_members_workspace_user;
  END IF;
END $$;
