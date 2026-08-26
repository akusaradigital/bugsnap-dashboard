-- Revoke anon and PUBLIC execution from all authenticated-only INVOKER functions

REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon;

REVOKE ALL ON FUNCTION public.create_project(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_project(uuid, text, text) FROM anon;

REVOKE ALL ON FUNCTION public.create_workspace(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_workspace(text) FROM anon;

REVOKE ALL ON FUNCTION public.dashboard_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_stats(uuid) FROM anon;

REVOKE ALL ON FUNCTION public.delete_expired_captures(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_expired_captures(uuid, int) FROM anon;

REVOKE ALL ON FUNCTION public.get_my_workspaces() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_workspaces() FROM anon;

REVOKE ALL ON FUNCTION public.get_workspace_members(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_workspace_members(uuid) FROM anon;

REVOKE ALL ON FUNCTION public.get_workspace_projects(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_workspace_projects(uuid) FROM anon;

REVOKE ALL ON FUNCTION public.rename_project(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rename_project(uuid, text, text) FROM anon;

REVOKE ALL ON FUNCTION public.weekly_stats(uuid, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) FROM anon;

-- Keep authenticated access
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_captures(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_workspaces() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_projects(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_project(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) TO authenticated;
