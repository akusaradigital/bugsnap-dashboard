-- =====================================================================
-- 20260824140000_fix_supabase_linter_security_advisors.sql
-- Fixes all Security Advisor findings (3 ERRORS, 5 INFOs, and WARNINGs)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FIX ERRORS
-- ---------------------------------------------------------------------

-- Error 1: Security Definer View on captures_with_owner
-- Convert to security_invoker = true so RLS of the querying user is enforced
DROP VIEW IF EXISTS public.captures_with_owner CASCADE;
CREATE VIEW public.captures_with_owner
WITH (security_invoker = true)
AS
  SELECT
    c.id,
    c.workspace_id,
    c.title,
    c.type,
    c.drive_url,
    c.description,
    c.dev_logs,
    c.os,
    c.browser,
    c.window_size,
    c.password,
    c.expires_at,
    c.user_id,
    c.owner_email,
    c.site_url,
    c.created_at,
    c.drive_file_id,
    c.duration,
    c.burn_after_read,
    c.allowed_domains,
    c.allowed_ips,
    c.folder_name,
    c.tag,
    c.status,
    u.email AS owner_email_addr,
    u.full_name AS owner_name,
    u.avatar_url AS owner_avatar
  FROM public.captures c
  LEFT JOIN public.users u ON u.id = c.user_id;

GRANT SELECT ON public.captures_with_owner TO authenticated;

-- Error 2: RLS Disabled on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users self select" ON public.users;
CREATE POLICY "users self select" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users workspace members select" ON public.users;
CREATE POLICY "users workspace members select" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members m1
      JOIN public.workspace_members m2 ON m1.workspace_id = m2.workspace_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = users.id
    )
  );

DROP POLICY IF EXISTS "users self update" ON public.users;
CREATE POLICY "users self update" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Error 3: RLS Disabled on public.comment_spam_guard
ALTER TABLE public.comment_spam_guard ENABLE ROW LEVEL SECURITY;

-- Table is only accessed through SECURITY DEFINER RPCs (post_comment)
-- Provide a fallback policy so linter is satisfied
DROP POLICY IF EXISTS "comment_spam_guard service role only" ON public.comment_spam_guard;
CREATE POLICY "comment_spam_guard service role only" ON public.comment_spam_guard
  FOR ALL TO authenticated
  USING (false);

-- ---------------------------------------------------------------------
-- 2. FIX INFO (RLS Enabled No Policy Warnings)
-- ---------------------------------------------------------------------

-- Info 1: capture_delete_audit
DROP POLICY IF EXISTS "capture_delete_audit owner select" ON public.capture_delete_audit;
CREATE POLICY "capture_delete_audit owner select" ON public.capture_delete_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = capture_delete_audit.workspace_id AND w.owner_user_id = auth.uid()
    )
  );

-- Info 2: capture_views
DROP POLICY IF EXISTS "capture_views capture owner select" ON public.capture_views;
CREATE POLICY "capture_views capture owner select" ON public.capture_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.captures c
      JOIN public.workspaces w ON w.id = c.workspace_id
      WHERE c.id = capture_views.capture_id AND w.owner_user_id = auth.uid()
    )
  );

-- Info 3: deleted_drive_folders
DROP POLICY IF EXISTS "deleted_drive_folders owner all" ON public.deleted_drive_folders;
CREATE POLICY "deleted_drive_folders owner all" ON public.deleted_drive_folders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = deleted_drive_folders.workspace_id AND w.owner_user_id = auth.uid()
    )
  );

-- Info 4: google_drive_connections
DROP POLICY IF EXISTS "google_drive_connections user select" ON public.google_drive_connections;
CREATE POLICY "google_drive_connections user select" ON public.google_drive_connections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Info 5: google_drive_oauth_states
DROP POLICY IF EXISTS "google_drive_oauth_states user select" ON public.google_drive_oauth_states;
CREATE POLICY "google_drive_oauth_states user select" ON public.google_drive_oauth_states
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. FIX WARNINGS: Overly Permissive Policies
-- ---------------------------------------------------------------------

-- Comments INSERT: comments are inserted via the post_comment() RPC.
-- If direct table insert policy exists, lock it down or enforce body constraints.
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments insert auth" ON public.comments;
DROP POLICY IF EXISTS "comments insert anon" ON public.comments;

-- ---------------------------------------------------------------------
-- 4. FIX WARNINGS: Anon Execution on Internal SECURITY DEFINER Functions
-- ---------------------------------------------------------------------

-- Revoke anon execute from functions meant ONLY for authenticated users
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_workspace(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.dashboard_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_expired_captures(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_workspace_folder(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_plan() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_workspaces() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_workspace_members(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_member_capacity(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_plan(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.invite_member_by_email(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rename_workspace_folder(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_theme(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.workspace_member_count(uuid) FROM anon;

-- Ensure authenticated role still has execution rights on these core functions
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_captures(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_workspace_folder(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_workspaces() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_member_capacity(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_plan(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_member_by_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_workspace_folder(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_theme(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_member_count(uuid) TO authenticated;
