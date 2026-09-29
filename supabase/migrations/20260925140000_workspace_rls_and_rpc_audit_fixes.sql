-- =====================================================================
-- Migration: 20260925140000_workspace_rls_and_rpc_audit_fixes.sql
-- Comprehensive Workspace RLS, RPC, and Schema Audit Remediation
-- 
-- Fixes:
-- 1. Add missing avatar_url column to public.workspaces (fixes 42703 error in /settings).
-- 2. Define is_workspace_member and is_workspace_owner SECURITY DEFINER helper
--    functions to prevent RLS recursion and cleanly check membership.
-- 3. Fix workspaces RLS: allow workspace members (not just owners) to SELECT
--    their workspace metadata, while keeping INSERT/UPDATE/DELETE owner-only.
-- 4. Fix workspace_members RLS: allow members to SELECT all fellow members,
--    allow members to DELETE their own membership (leave workspace),
--    and PREVENT owners from deleting their own membership row.
-- 5. Fix captures RLS: allow authenticated users to SELECT their own captures
--    even when workspace_id is NULL (e.g. after workspace deletion).
-- 6. Drop obsolete duplicate policies on captures (Enable delete for owners,
--    Enable update for owners).
-- 7. Fix get_my_workspaces(): restore SECURITY DEFINER so non-owner members
--    can see their workspaces, and include avatar_url + owner_user_id.
-- 8. Fix get_workspace_members(): restore SECURITY DEFINER so non-owner members
--    can see other teammates in the workspace roster.
-- 9. Add update_member_role RPC with strict ownership and escalation checks.
-- 10. Add delete_workspace RPC for clean owner-controlled workspace deletion.
-- 11. Fix search_path on invite_member_by_email to include pg_temp.
-- 12. Revoke table-level mutation/truncate grants from anon on all workspace tables.
-- =====================================================================

-- 1. Ensure avatar_url column exists on public.workspaces
ALTER TABLE public.workspaces 
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

-- 2. Security Definer Helper Functions (no RLS recursion)
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = p_workspace_id AND owner_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_workspace_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(uuid) TO authenticated, service_role;

-- 3. Hardening RLS on public.workspaces
DROP POLICY IF EXISTS "workspaces owner select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces member select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces owner insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces owner update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces owner delete" ON public.workspaces;

CREATE POLICY "workspaces member select" ON public.workspaces
  FOR SELECT TO authenticated USING (
    owner_user_id = auth.uid()
    OR public.is_workspace_member(id)
  );

CREATE POLICY "workspaces owner insert" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (
    owner_user_id = auth.uid()
  );

CREATE POLICY "workspaces owner update" ON public.workspaces
  FOR UPDATE TO authenticated USING (
    owner_user_id = auth.uid()
  ) WITH CHECK (
    owner_user_id = auth.uid()
  );

CREATE POLICY "workspaces owner delete" ON public.workspaces
  FOR DELETE TO authenticated USING (
    owner_user_id = auth.uid()
  );

-- 4. Hardening RLS on public.workspace_members
DROP POLICY IF EXISTS "members select own or owner" ON public.workspace_members;
DROP POLICY IF EXISTS "members select workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "members owner insert" ON public.workspace_members;
DROP POLICY IF EXISTS "members owner delete" ON public.workspace_members;
DROP POLICY IF EXISTS "members delete" ON public.workspace_members;

-- Members can see other members in the same workspace
CREATE POLICY "members select workspace" ON public.workspace_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.is_workspace_owner(workspace_id)
    OR public.is_workspace_member(workspace_id)
  );

-- Only owners can insert members directly
CREATE POLICY "members owner insert" ON public.workspace_members
  FOR INSERT TO authenticated WITH CHECK (
    public.is_workspace_owner(workspace_id)
  );

-- Members can leave (delete self), owners can remove other members (NOT themselves)
CREATE POLICY "members delete" ON public.workspace_members
  FOR DELETE TO authenticated USING (
    (user_id = auth.uid() AND NOT public.is_workspace_owner(workspace_id))
    OR
    (public.is_workspace_owner(workspace_id) AND user_id != auth.uid())
  );

-- 5. Fix captures RLS: support user_id = auth.uid() fallback for unparented/orphaned captures
DROP POLICY IF EXISTS "Enable select for authenticated workspace members" ON public.captures;
DROP POLICY IF EXISTS "captures_select" ON public.captures;
CREATE POLICY "captures_select" ON public.captures
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR (
      workspace_id IS NOT NULL 
      AND public.is_workspace_member(workspace_id)
    )
  );

-- 6. Clean up obsolete duplicate capture policies
DROP POLICY IF EXISTS "Enable delete for owners" ON public.captures;
DROP POLICY IF EXISTS "Enable update for owners" ON public.captures;

-- 7. Fix get_my_workspaces(): restore SECURITY DEFINER & include avatar_url and owner_user_id
DROP FUNCTION IF EXISTS public.get_my_workspaces() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_workspaces()
RETURNS TABLE(
  id uuid,
  name text,
  role text,
  is_owner boolean,
  created_at timestamptz,
  avatar_url text,
  owner_user_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    w.id,
    w.name,
    wm.role,
    (wm.role = 'owner') AS is_owner,
    w.created_at,
    w.avatar_url,
    w.owner_user_id
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = auth.uid()
  ORDER BY is_owner DESC, w.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_my_workspaces() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_workspaces() TO authenticated;

-- 8. Fix get_workspace_members(): restore SECURITY DEFINER so non-owner members can see teammates
DROP FUNCTION IF EXISTS public.get_workspace_members(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspace_members(p_workspace_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    m.user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    m.role,
    m.joined_at
  FROM public.workspace_members m
  JOIN public.users u ON u.id = m.user_id
  WHERE m.workspace_id = p_workspace_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members self_m
      WHERE self_m.workspace_id = p_workspace_id AND self_m.user_id = auth.uid()
    )
  ORDER BY m.joined_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_workspace_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO authenticated;

-- 9. Add RPC: update_member_role
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_workspace_id uuid,
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text := lower(btrim(p_role));
  v_target_role text;
BEGIN
  IF v_role NOT IN ('creator', 'viewer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be creator, viewer, or admin' USING errcode = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = p_workspace_id AND owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden: Only workspace owners can modify member roles' USING errcode = '42501';
  END IF;

  SELECT role INTO v_target_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Member not found in this workspace' USING errcode = 'P0002';
  END IF;

  IF v_target_role = 'owner' OR p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change the workspace owner role' USING errcode = '42501';
  END IF;

  UPDATE public.workspace_members
  SET role = v_role
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_member_role(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_member_role(uuid, uuid, text) TO authenticated;

-- 10. Add RPC: delete_workspace
CREATE OR REPLACE FUNCTION public.delete_workspace(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = p_workspace_id AND owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden: Only workspace owners can delete a workspace' USING errcode = '42501';
  END IF;

  DELETE FROM public.workspaces
  WHERE id = p_workspace_id AND owner_user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_workspace(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_workspace(uuid) TO authenticated;

-- 11. Harden invite_member_by_email search_path
CREATE OR REPLACE FUNCTION public.invite_member_by_email(
  p_workspace_id uuid,
  p_email text,
  p_role text DEFAULT 'creator'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_email text := lower(btrim(p_email));
  v_role text := lower(btrim(coalesce(p_role, 'creator')));
BEGIN
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF v_role NOT IN ('creator', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_workspace_id AND w.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not the owner of this workspace';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email;

  IF v_user_id IS NULL THEN
    INSERT INTO public.workspace_invites (workspace_id, email, role, invited_by, created_at)
    VALUES (p_workspace_id, v_email, v_role, auth.uid(), now())
    ON CONFLICT (workspace_id, lower(email)) DO UPDATE
      SET invited_by = excluded.invited_by,
          role = excluded.role,
          created_at = now(),
          accepted_at = null;
    RETURN 'pending';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
  VALUES (p_workspace_id, v_user_id, v_role, now())
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = excluded.role;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE workspace_id = p_workspace_id AND lower(email) = v_email AND accepted_at IS NULL;

  RETURN 'added';
END;
$$;

REVOKE ALL ON FUNCTION public.invite_member_by_email(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_member_by_email(uuid, text, text) TO authenticated;

-- 12. Revoke table-level mutation & truncate privileges from anon
REVOKE ALL ON public.workspaces FROM anon, PUBLIC;
REVOKE ALL ON public.workspace_members FROM anon, PUBLIC;
REVOKE ALL ON public.workspace_settings FROM anon, PUBLIC;
REVOKE ALL ON public.workspace_invites FROM anon, PUBLIC;
REVOKE ALL ON public.workspace_folders FROM anon, PUBLIC;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.captures FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_folders TO authenticated;
GRANT SELECT, DELETE ON public.workspace_invites TO authenticated;
