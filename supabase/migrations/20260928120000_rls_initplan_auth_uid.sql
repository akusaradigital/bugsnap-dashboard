-- Wrap auth.uid() as (select auth.uid()) in every RLS policy that used it bare.
--
-- A bare auth.uid() in a policy expression is VOLATILE per row: Postgres
-- re-executes it for every row the query scans. Wrapped in a scalar subquery it
-- becomes an InitPlan, evaluated once per statement. Same semantics, same rows
-- returned - only the per-row cost disappears. This is the single most common
-- Supabase performance defect and Supabase's own linter (auth_rls_initplan)
-- flags it.
--
-- Generated from live pg_policies, so every USING/WITH CHECK below is the
-- existing expression with only auth.uid() rewritten. No permission changes.

BEGIN;
-- policies rewritten: 27
DROP POLICY IF EXISTS "Audit logs viewable by capture owner" ON public."audit_logs";
CREATE POLICY "Audit logs viewable by capture owner" ON public."audit_logs"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (captures c
     JOIN workspaces w ON ((w.id = c.workspace_id)))
  WHERE ((c.id = audit_logs.capture_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "capture_delete_audit owner select" ON public."capture_delete_audit";
CREATE POLICY "capture_delete_audit owner select" ON public."capture_delete_audit"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = capture_delete_audit.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "capture_views capture owner select" ON public."capture_views";
CREATE POLICY "capture_views capture owner select" ON public."capture_views"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (captures c
     JOIN workspaces w ON ((w.id = c.workspace_id)))
  WHERE ((c.id = capture_views.capture_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "captures_delete" ON public."captures";
CREATE POLICY "captures_delete" ON public."captures"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = captures.workspace_id) AND (w.owner_user_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = captures.workspace_id) AND (wm.user_id = (select auth.uid())) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

DROP POLICY IF EXISTS "captures_select" ON public."captures";
CREATE POLICY "captures_select" ON public."captures"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = (select auth.uid())) OR ((workspace_id IS NOT NULL) AND is_workspace_member(workspace_id))));

DROP POLICY IF EXISTS "captures_update" ON public."captures";
CREATE POLICY "captures_update" ON public."captures"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = captures.workspace_id) AND (w.owner_user_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = captures.workspace_id) AND (wm.user_id = (select auth.uid())) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'creator'::text, 'member'::text])))))))
  WITH CHECK (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = captures.workspace_id) AND (w.owner_user_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = captures.workspace_id) AND (wm.user_id = (select auth.uid())) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'creator'::text, 'member'::text])))))));

DROP POLICY IF EXISTS "deleted_drive_folders owner all" ON public."deleted_drive_folders";
CREATE POLICY "deleted_drive_folders owner all" ON public."deleted_drive_folders"
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = deleted_drive_folders.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "google_drive_connections user select" ON public."google_drive_connections";
CREATE POLICY "google_drive_connections user select" ON public."google_drive_connections"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "google_drive_oauth_states user select" ON public."google_drive_oauth_states";
CREATE POLICY "google_drive_oauth_states user select" ON public."google_drive_oauth_states"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "projects members select" ON public."projects";
CREATE POLICY "projects members select" ON public."projects"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = projects.workspace_id) AND (m.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "projects owners write" ON public."projects";
CREATE POLICY "projects owners write" ON public."projects"
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = projects.workspace_id) AND (w.owner_user_id = (select auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = projects.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "users self select" ON public."users";
CREATE POLICY "users self select" ON public."users"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "users self update" ON public."users";
CREATE POLICY "users self update" ON public."users"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((select auth.uid()) = id))
  WITH CHECK (((select auth.uid()) = id));

DROP POLICY IF EXISTS "users workspace members select" ON public."users";
CREATE POLICY "users workspace members select" ON public."users"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (workspace_members m1
     JOIN workspace_members m2 ON ((m1.workspace_id = m2.workspace_id)))
  WHERE ((m1.user_id = (select auth.uid())) AND (m2.user_id = users.id)))));

DROP POLICY IF EXISTS "workspace folders members select" ON public."workspace_folders";
CREATE POLICY "workspace folders members select" ON public."workspace_folders"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = workspace_folders.workspace_id) AND (m.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "workspace folders owners write" ON public."workspace_folders";
CREATE POLICY "workspace folders owners write" ON public."workspace_folders"
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_folders.workspace_id) AND (w.owner_user_id = (select auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_folders.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "workspace invites owner delete" ON public."workspace_invites";
CREATE POLICY "workspace invites owner delete" ON public."workspace_invites"
  AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_invites.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "workspace invites owner select" ON public."workspace_invites";
CREATE POLICY "workspace invites owner select" ON public."workspace_invites"
  AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_invites.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "members delete" ON public."workspace_members";
CREATE POLICY "members delete" ON public."workspace_members"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((((user_id = (select auth.uid())) AND (NOT is_workspace_owner(workspace_id))) OR (is_workspace_owner(workspace_id) AND (user_id <> (select auth.uid())))));

DROP POLICY IF EXISTS "members select workspace" ON public."workspace_members";
CREATE POLICY "members select workspace" ON public."workspace_members"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = (select auth.uid())) OR is_workspace_owner(workspace_id) OR is_workspace_member(workspace_id)));

DROP POLICY IF EXISTS "workspace settings owners write" ON public."workspace_settings";
CREATE POLICY "workspace settings owners write" ON public."workspace_settings"
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_settings.workspace_id) AND (w.owner_user_id = (select auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_settings.workspace_id) AND (w.owner_user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "workspace_settings_select" ON public."workspace_settings";
CREATE POLICY "workspace_settings_select" ON public."workspace_settings"
  AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM workspace_members
  WHERE ((workspace_members.workspace_id = workspace_settings.workspace_id) AND (workspace_members.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "workspace_settings_upsert" ON public."workspace_settings";
CREATE POLICY "workspace_settings_upsert" ON public."workspace_settings"
  AS PERMISSIVE FOR ALL TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = workspace_settings.workspace_id) AND (wm.user_id = (select auth.uid())) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_settings.workspace_id) AND (w.owner_user_id = (select auth.uid())))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = workspace_settings.workspace_id) AND (wm.user_id = (select auth.uid())) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_settings.workspace_id) AND (w.owner_user_id = (select auth.uid())))))));

DROP POLICY IF EXISTS "workspaces member select" ON public."workspaces";
CREATE POLICY "workspaces member select" ON public."workspaces"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((owner_user_id = (select auth.uid())) OR is_workspace_member(id)));

DROP POLICY IF EXISTS "workspaces owner delete" ON public."workspaces";
CREATE POLICY "workspaces owner delete" ON public."workspaces"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((owner_user_id = (select auth.uid())));

DROP POLICY IF EXISTS "workspaces owner insert" ON public."workspaces";
CREATE POLICY "workspaces owner insert" ON public."workspaces"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owner_user_id = (select auth.uid())));

DROP POLICY IF EXISTS "workspaces owner update" ON public."workspaces";
CREATE POLICY "workspaces owner update" ON public."workspaces"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((owner_user_id = (select auth.uid())))
  WITH CHECK ((owner_user_id = (select auth.uid())));


COMMIT;
