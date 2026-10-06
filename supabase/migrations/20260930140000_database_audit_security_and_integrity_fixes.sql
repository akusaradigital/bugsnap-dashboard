-- =====================================================================
-- 20260930140000_database_audit_security_and_integrity_fixes.sql
--
-- Comprehensive Supabase database audit remediation:
--
-- 1. Structural / Integrity:
--    - Enforce NOT NULL on workspace_members.workspace_id (was nullable)
--    - Enforce NOT NULL on comments.capture_id (was nullable)
--    - Enforce NOT NULL on workspaces.created_at & workspaces.updated_at
--
-- 2. Performance:
--    - Add partial index on captures(expires_at) for fast expiration queries
--
-- 3. RLS Permissive Overlap & Role Hardening:
--    - Resolve multiple permissive policies on projects, workspace_folders,
--      and workspace_settings by separating write (INSERT/UPDATE/DELETE)
--      from read (SELECT). This eliminates redundant predicate evaluations.
--    - Scope workspace_invites policies TO authenticated (was granted TO public)
--    - Drop redundant qual:false policy on comment_spam_guard (RLS denies by default)
--
-- 4. Function Search Path Hardening:
--    - Ensure search_path = public, pg_temp on all SECURITY DEFINER functions
--      to protect against search_path hijacking via temporary objects.
--
-- 5. RPC Privilege Hardening:
--    - Revoke excessive anon/PUBLIC execution on maintenance and user RPCs:
--      prune_ephemeral_data, prune_capture_views, reorder_workspace_folders,
--      update_user_notification_prefs, track_paywall_hit,
--      get_projects_by_workspace_and_email, get_folders_by_workspace_and_email
--
-- 6. Cleanup Obsolete Function Overload:
--    - Drop legacy 1-arg delete_capture_with_audit(uuid) which bypassed audit logs
--
-- 7. Retention & Expiry Bugfix:
--    - auto_prune_all_expired_captures now also cleans up captures with
--      expired expires_at and viewed burn_after_read captures
--
-- 8. Access Gate Alignment:
--    - get_capture_by_drive_id validates minimum drive_id length (>= 10 chars)
--    - can_read_comments_for_capture aligns with capture expiration & burn rules
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. STRUCTURAL / INTEGRITY
-- ---------------------------------------------------------------------

ALTER TABLE public.workspace_members
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.comments
  ALTER COLUMN capture_id SET NOT NULL;

ALTER TABLE public.workspaces
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- ---------------------------------------------------------------------
-- 2. PERFORMANCE INDEXING
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_captures_expires_at
  ON public.captures (expires_at)
  WHERE expires_at IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. RLS PERMISSIVE OVERLAP & ROLE HARDENING
-- ---------------------------------------------------------------------

-- 3a. projects
DROP POLICY IF EXISTS "projects owners write" ON public.projects;
DROP POLICY IF EXISTS "projects members select" ON public.projects;

CREATE POLICY "projects members select" ON public.projects
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = projects.workspace_id AND w.owner_user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.workspace_id = projects.workspace_id AND m.user_id = (select auth.uid())
    )
  );

CREATE POLICY "projects owners insert" ON public.projects
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = projects.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "projects owners update" ON public.projects
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = projects.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = projects.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "projects owners delete" ON public.projects
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = projects.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  );

-- 3b. workspace_folders
DROP POLICY IF EXISTS "workspace folders owners write" ON public.workspace_folders;
DROP POLICY IF EXISTS "workspace folders members select" ON public.workspace_folders;

CREATE POLICY "workspace folders members select" ON public.workspace_folders
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_folders.workspace_id AND w.owner_user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.workspace_id = workspace_folders.workspace_id AND m.user_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace folders owners insert" ON public.workspace_folders
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_folders.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace folders owners update" ON public.workspace_folders
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_folders.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_folders.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace folders owners delete" ON public.workspace_folders
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_folders.workspace_id AND w.owner_user_id = (select auth.uid())
    )
  );

-- 3c. workspace_settings
DROP POLICY IF EXISTS "workspace_settings_upsert" ON public.workspace_settings;
DROP POLICY IF EXISTS "workspace_settings_select" ON public.workspace_settings;

CREATE POLICY "workspace_settings_select" ON public.workspace_settings
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id AND w.owner_user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace_settings_insert" ON public.workspace_settings
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = (select auth.uid())
        AND wm.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id
        AND w.owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace_settings_update" ON public.workspace_settings
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = (select auth.uid())
        AND wm.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id
        AND w.owner_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = (select auth.uid())
        AND wm.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id
        AND w.owner_user_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace_settings_delete" ON public.workspace_settings
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = (select auth.uid())
        AND wm.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id
        AND w.owner_user_id = (select auth.uid())
    )
  );

-- 3d. workspace_invites: narrow roles from public to authenticated
DROP POLICY IF EXISTS "workspace invites owner select" ON public.workspace_invites;
CREATE POLICY "workspace invites owner select" ON public.workspace_invites
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_invites.workspace_id
        AND w.owner_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "workspace invites owner delete" ON public.workspace_invites;
CREATE POLICY "workspace invites owner delete" ON public.workspace_invites
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_invites.workspace_id
        AND w.owner_user_id = (select auth.uid())
    )
  );

-- 3e. comment_spam_guard: drop redundant qual:false policy
DROP POLICY IF EXISTS "comment_spam_guard service role only" ON public.comment_spam_guard;

-- ---------------------------------------------------------------------
-- 4. FUNCTION SEARCH PATH HARDENING
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_s integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_s))
  on conflict (key) do update
    set count    = case when public.rate_limits.reset_at < now() then 1
                        else public.rate_limits.count + 1 end,
        reset_at = case when public.rate_limits.reset_at < now()
                        then now() + make_interval(secs => p_window_s)
                        else public.rate_limits.reset_at end
  returning count into v_count;

  return v_count > p_limit;
end;
$$;

CREATE OR REPLACE FUNCTION public.delete_deleted_drive_folder_by_email(p_email text, p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  delete from public.deleted_drive_folders ddf
  where ddf.id = p_id
    and ddf.workspace_id in (
      select w.id
      from public.workspaces w
      join public.users u on u.id = w.owner_user_id
      where lower(trim(u.email)) = lower(trim(p_email))
    );
$$;

CREATE OR REPLACE FUNCTION public.get_deleted_folders_by_email(p_email text)
RETURNS SETOF deleted_drive_folders
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select ddf.*
  from public.deleted_drive_folders ddf
  where ddf.workspace_id in (
    select w.id
    from public.workspaces w
    join public.users u on u.id = w.owner_user_id
    where lower(trim(u.email)) = lower(trim(p_email))
       or exists (
         select 1
         from public.workspace_members m
         join public.users mu on mu.id = m.user_id
         where m.workspace_id = w.id
           and lower(trim(mu.email)) = lower(trim(p_email))
       )
  )
  order by ddf.created_at asc;
$$;

CREATE OR REPLACE FUNCTION public.get_folders_by_email(p_email text)
RETURNS TABLE(id uuid, workspace_id uuid, name text, drive_folder_id text, is_default boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
#variable_conflict use_column
DECLARE
  v_workspace_ids UUID[];
BEGIN
  SELECT array_agg(DISTINCT wm.workspace_id) INTO v_workspace_ids
  FROM public.workspace_members wm
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email));

  IF v_workspace_ids IS NULL OR array_length(v_workspace_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.workspace_folders (workspace_id, name)
  SELECT DISTINCT c.workspace_id, c.folder_name
  FROM public.captures c
  WHERE c.workspace_id = ANY(v_workspace_ids)
    AND c.folder_name IS NOT NULL
    AND c.folder_name <> ''
  ON CONFLICT (workspace_id, name) DO NOTHING;

  RETURN QUERY
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default
  FROM public.workspace_folders wf
  WHERE wf.workspace_id = ANY(v_workspace_ids)
  ORDER BY wf.is_default DESC, wf.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_projects_by_workspace_and_email(p_email text, p_workspace_id uuid)
RETURNS TABLE(id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select p.id, p.workspace_id, p.name, p.description, p.is_default, p.created_at
  from public.projects p
  where p.workspace_id = p_workspace_id
    and exists (
      select 1
      from public.workspace_members m
      join public.users u on u.id = m.user_id
      where m.workspace_id = p.workspace_id
        and lower(trim(u.email)) = lower(trim(p_email))
    )
  order by p.is_default desc, p.name asc;
$$;

CREATE OR REPLACE FUNCTION public.link_folder_drive_id(p_email text, p_folder_name text, p_drive_folder_id text)
RETURNS TABLE(name text, drive_folder_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.workspace_folders wf
  SET drive_folder_id = p_drive_folder_id
  FROM public.workspace_members wm JOIN public.users u ON u.id = wm.user_id
  WHERE wf.workspace_id = wm.workspace_id
    AND LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND wf.name = TRIM(p_folder_name)
    AND p_drive_folder_id IS NOT NULL
    AND p_drive_folder_id <> ''
  RETURNING wf.name, wf.drive_folder_id;
$$;

CREATE OR REPLACE FUNCTION public.reorder_workspace_folders(p_workspace_id uuid, p_folder_names text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name TEXT;
  v_idx INT := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = p_workspace_id AND owner_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;
  FOREACH v_name IN ARRAY p_folder_names LOOP
    INSERT INTO public.workspace_folders (workspace_id, name, sort_order)
    VALUES (p_workspace_id, v_name, v_idx)
    ON CONFLICT (workspace_id, name) DO UPDATE SET sort_order = v_idx;
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_paywall_hit(p_feature text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is not null then
    update public.users
    set paywall_hits = coalesce(paywall_hits, 0) + 1,
        last_paywall_feature = p_feature,
        last_paywall_at = now()
    where id = v_user_id;
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.update_user_notification_prefs(p_prefs jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
begin
  update public.users
  set notification_prefs = coalesce(public.users.notification_prefs, '{}'::jsonb) || p_prefs
  where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- 5. RPC PRIVILEGE HARDENING
-- ---------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.prune_ephemeral_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_ephemeral_data() TO service_role;

REVOKE ALL ON FUNCTION public.prune_capture_views() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_capture_views() TO service_role;

REVOKE ALL ON FUNCTION public.reorder_workspace_folders(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_workspace_folders(uuid, text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_user_notification_prefs(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_notification_prefs(jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.track_paywall_hit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_paywall_hit(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_projects_by_workspace_and_email(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_projects_by_workspace_and_email(text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 6. CLEANUP OBSOLETE FUNCTION OVERLOAD
-- ---------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.delete_capture_with_audit(uuid);

-- ---------------------------------------------------------------------
-- 7. RETENTION & EXPIRY FIX IN auto_prune_all_expired_captures
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_prune_all_expired_captures(p_batch_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_deleted int := 0;
  v_ws record;
  v_deleted int;
  v_cutoff timestamptz;
  v_limit int := greatest(1, least(coalesce(p_batch_limit, 500), 2000));
BEGIN
  -- 1. Scan all workspaces that have active retention (3, 6, 12 months)
  -- 0 = Never (skipped)
  FOR v_ws IN
    SELECT workspace_id, auto_delete_months
    FROM public.workspace_settings
    WHERE auto_delete_months IN (3, 6, 12)
  LOOP
    v_cutoff := now() - (v_ws.auto_delete_months || ' months')::interval;

    DELETE FROM public.captures
    WHERE id IN (
      SELECT id FROM public.captures
      WHERE workspace_id = v_ws.workspace_id
        AND created_at < v_cutoff
      ORDER BY created_at ASC
      LIMIT v_limit
      FOR UPDATE SKIP LOCKED
    );

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
  END LOOP;

  -- 2. Prune captures with explicit past expiration or viewed burn-after-read
  DELETE FROM public.captures
  WHERE id IN (
    SELECT id FROM public.captures
    WHERE (expires_at IS NOT NULL AND expires_at < now())
       OR (burn_after_read = true AND view_count > 0)
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  );
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  v_total_deleted := v_total_deleted + v_deleted;

  RETURN jsonb_build_object(
    'success', true,
    'total_deleted', v_total_deleted,
    'timestamp', now()
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 8. ACCESS GATE ALIGNMENT (DRIVE LOOKUP & COMMENT PERMISSIONS)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_capture_by_drive_id(p_drive_id text)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id
  FROM public.captures c
  WHERE c.drive_url IS NOT NULL
    AND p_drive_id IS NOT NULL
    AND length(btrim(p_drive_id)) >= 10
    AND position(lower(btrim(p_drive_id)) in lower(c.drive_url)) > 0
    AND (c.expires_at IS NULL OR c.expires_at > now())
    AND (c.burn_after_read IS NOT TRUE OR c.view_count = 0)
    AND c.access_mode != 'members'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_read_comments_for_capture(p_capture_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = p_capture_id
      AND (
        -- Member or owner can read even if expired
        (auth.uid() IS NOT NULL AND (
          c.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = c.workspace_id AND w.owner_user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid()
          )
        ))
        -- Public visitors can read only if not members-only, not expired, and not burned
        OR (
          COALESCE(c.access_mode, 'public') <> 'members'
          AND (c.expires_at IS NULL OR c.expires_at > now())
          AND (c.burn_after_read IS NOT TRUE OR c.view_count = 0)
        )
      )
  );
$$;

COMMIT;
