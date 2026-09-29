-- Migration: 20260925100000_fix_comments_select_rls.sql
-- Fix comments SELECT RLS policy for anonymous visitors & external collaborators on /v/[id]
-- Problem:
-- 1. comments_select queried captures.access_mode, but anon did not have SELECT on captures.access_mode (throwing 42501 permission denied for table captures).
-- 2. captures table has RLS enabled with only authenticated workspace member select policies. Subquery inside comments RLS failed under anon role, returning 0 rows.
-- Solution:
-- 1. Grant SELECT (access_mode) on captures to anon, authenticated.
-- 2. Provide a STABLE SECURITY DEFINER helper function can_read_comments_for_capture(uuid) so checking capture access bypasses captures RLS safely without exposing private columns.

GRANT SELECT (access_mode) ON public.captures TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_read_comments_for_capture(p_capture_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = p_capture_id
      AND (
        COALESCE(c.access_mode, 'public') <> 'members'
        OR (
          auth.uid() IS NOT NULL AND (
            c.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.workspaces w
              WHERE w.id = c.workspace_id AND w.owner_user_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1 FROM public.workspace_members wm
              WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid()
            )
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_comments_for_capture(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_comments_for_capture(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments read" ON public.comments;

CREATE POLICY "comments_select" ON public.comments
FOR SELECT TO anon, authenticated
USING (
  public.can_read_comments_for_capture(capture_id)
);
