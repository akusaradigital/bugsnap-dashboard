-- =====================================================================
-- 20260916200000_index_audit_fixes.sql
-- Database Performance Audit Fixes:
--   1. Drop redundant duplicate index on comments (write overhead)
--   2. Add captures.user_id index (missing FK index, hits cron delete path)
--   3. Add workspace_members.user_id standalone index (CRITICAL hot RLS path)
--   4. Add workspace_members.joined_at index (sort optimization)
--   5. Add audit_logs.user_id partial index
--   6. Add workspace_folders.workspace_id standalone index
--   7. Add google_drive_oauth_states.expires_at partial index
-- =====================================================================

-- 1. Drop the older duplicate index on comments.
--    comments_capture_id_created_at_idx (002) = ON (capture_id, created_at ASC)
--    comments_capture_id_created_idx    (012) = ON (capture_id, created_at)
--    Both are functionally identical B-trees; drop the 012 duplicate.
DROP INDEX IF EXISTS public.comments_capture_id_created_idx;

-- 2. captures.user_id — FK to auth.users, used in creator-delete path and
--    RPC delete_capture_with_audit WHERE captures.user_id = p_user_id.
--    Without this index every cron cleanup does a seq scan on the largest table.
CREATE INDEX IF NOT EXISTS captures_user_id_idx
  ON public.captures (user_id);

-- 3. workspace_members.user_id — standalone index.
--    The existing composite UNIQUE (workspace_id, user_id) cannot serve
--    queries that filter ONLY on user_id (e.g. get_my_workspaces subquery,
--    RLS policy "members select own or owner").
--    This is the highest-impact missing index: hits every dashboard page load.
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx
  ON public.workspace_members (user_id);

-- 4. workspace_members.joined_at — ORDER BY joined_at ASC used in
--    get_workspace_members() and get_my_workspaces().
CREATE INDEX IF NOT EXISTS workspace_members_joined_at_idx
  ON public.workspace_members (joined_at ASC);

-- 5. audit_logs.user_id — admin queries filter by user_id; table grows with
--    every public capture view call.
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx
  ON public.audit_logs (user_id)
  WHERE user_id IS NOT NULL;

-- 6. workspace_folders.workspace_id — full list of folders per workspace
--    (WHERE workspace_id = $1) cannot use the partial unique index
--    (workspace_id) WHERE is_default.
CREATE INDEX IF NOT EXISTS workspace_folders_workspace_id_idx
  ON public.workspace_folders (workspace_id);

-- 7. google_drive_oauth_states.expires_at — partial index for cleanup queries
--    that scan expired OAuth state tokens.
CREATE INDEX IF NOT EXISTS google_drive_oauth_states_expires_at_idx
  ON public.google_drive_oauth_states (expires_at)
  WHERE expires_at IS NOT NULL;
