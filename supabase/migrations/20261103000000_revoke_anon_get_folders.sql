-- Security: revoke anon/PUBLIC execute on folder-listing RPCs.
-- These functions are only ever called server-side via service_role
-- (extension/folders/route.ts and workspace-context/route.ts).
-- No extension code calls them directly with the anon key any more.

REVOKE ALL ON FUNCTION public.get_folders_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_folders_by_email(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) TO authenticated, service_role;
