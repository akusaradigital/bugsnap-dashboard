-- Security Hardening: Revoke excess routine execution privileges from PUBLIC and anon.
-- In PostgreSQL, routines default to granting EXECUTE to PUBLIC unless explicitly revoked.

-- 1. get_workspaces_by_email: Re-secures regression from migration 20261021110000.
-- Called exclusively server-side via service_role (or authenticated users).
REVOKE ALL ON FUNCTION public.get_workspaces_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspaces_by_email(text) TO authenticated, service_role;

-- 2. set_workspace_folder_parent: Created in 20261021130000 without revoking anon/PUBLIC.
-- Internally requires auth.uid() != NULL; restricts callers to authenticated and service_role.
REVOKE ALL ON FUNCTION public.set_workspace_folder_parent(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_workspace_folder_parent(uuid, uuid, uuid) TO authenticated, service_role;

-- 3. Defect intelligence & fingerprint functions:
-- Internal workspace telemetry functions used by authenticated dashboard members.
REVOKE ALL ON FUNCTION public.get_workspace_fingerprint_counts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_fingerprint_counts(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_workspace_top_errors(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_top_errors(uuid, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_captures_by_fingerprint(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_captures_by_fingerprint(uuid, text, integer) TO authenticated, service_role;
