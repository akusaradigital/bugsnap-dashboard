-- =====================================================================
-- 20260918140000_revoke_anon_get_workspaces_by_email.sql
--
-- get_workspaces_by_email is SECURITY DEFINER, takes an arbitrary email and
-- unconditionally calls ensure_user_and_workspace_by_email - so an anon caller
-- holding the public key could enumerate any address and create a user +
-- workspace row for every one it tried.
--
-- Its only caller is /api/extension/workspace-context, a Route Handler using
-- the service role key. Nothing in bugsnap-extension/ calls it directly (unlike
-- delete_workspace_folder_by_email, which editor.js does hit with the anon key
-- and therefore keeps its grant). anon has no legitimate use for it.
-- =====================================================================

revoke execute on function public.get_workspaces_by_email(text) from anon;
