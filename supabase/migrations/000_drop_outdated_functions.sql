-- 000_drop_outdated_functions.sql
-- Pre-migration cleanup: Drop outdated function signatures cleanly before re-creating them.
DROP FUNCTION IF EXISTS public.get_public_capture CASCADE;
DROP FUNCTION IF EXISTS public.get_my_workspaces CASCADE;
DROP FUNCTION IF EXISTS public.create_workspace CASCADE;
DROP FUNCTION IF EXISTS public.create_workspace(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_members CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_members(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.invite_member_by_email CASCADE;
DROP FUNCTION IF EXISTS public.invite_member_by_email(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_settings CASCADE;
DROP FUNCTION IF EXISTS public.set_workspace_settings CASCADE;
