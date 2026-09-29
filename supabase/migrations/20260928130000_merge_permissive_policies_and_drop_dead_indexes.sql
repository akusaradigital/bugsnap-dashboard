-- Two performance fixes, no behaviour change.
--
-- PART 1 - collapse duplicate permissive policies.
--   Postgres evaluates EVERY permissive policy for a table/cmd/role and ORs the
--   results. Two policies where one would do means both predicates run on every
--   query. Merging them into a single OR is exactly the same access rule at half
--   the evaluations. Supabase's linter flags this as multiple_permissive_policies.
--
-- PART 2 - drop indexes that can never be used.
--   Each one still costs a write on every INSERT/UPDATE of its table. Kept
--   deliberately: every index backing a foreign key (even at zero scans - without
--   it a parent DELETE seq-scans the child), and every index whose column is a
--   lookup key in app code or in a SECURITY DEFINER RPC.

BEGIN;

-- ---------------------------------------------------------------------------
-- PART 1a: users SELECT - "self" OR "shares a workspace with me"
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users self select" ON public.users;
DROP POLICY IF EXISTS "users workspace members select" ON public.users;

CREATE POLICY "users select self or co-member" ON public.users
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1
      FROM workspace_members m1
      JOIN workspace_members m2 ON m1.workspace_id = m2.workspace_id
      WHERE m1.user_id = (select auth.uid())
        AND m2.user_id = users.id
    )
  );

-- ---------------------------------------------------------------------------
-- PART 1b: workspace_settings had THREE overlapping policies.
--
--   "workspace settings owners write" [ALL]    : workspace owner
--   "workspace_settings_upsert"       [ALL]    : owner OR member with role owner/admin
--   "workspace_settings_select"       [SELECT] : any member
--
-- The first is a strict subset of the second, so it only ever added cost. The
-- SELECT policy stays separate on purpose: a plain member may READ settings but
-- must not write them, and a FOR ALL policy would grant both.
--
-- Note it was also granted TO public rather than TO authenticated. auth.uid() is
-- NULL for an anonymous request so no row ever matched, but narrowing the role
-- means an anon request stops evaluating the predicate at all.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace settings owners write" ON public.workspace_settings;
DROP POLICY IF EXISTS "workspace_settings_select" ON public.workspace_settings;

-- "workspace_settings_upsert" [ALL] is left exactly as it is: it already covers
-- the owner case that the dropped policy handled.

CREATE POLICY "workspace_settings_select" ON public.workspace_settings
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_settings.workspace_id
        AND workspace_members.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- PART 2: redundant indexes - a strict column prefix of another index with the
-- same (absent) WHERE clause, so the wider index already serves every lookup.
-- ---------------------------------------------------------------------------

-- (capture_id) is a prefix of capture_views_dedupe_idx (capture_id, viewer_key, date)
DROP INDEX IF EXISTS public.capture_views_capture_idx;

-- (workspace_id) is a prefix of captures_ws_created_idx, captures_ws_type_idx
-- and idx_captures_ws_status - all three lead with workspace_id.
DROP INDEX IF EXISTS public.captures_workspace_id_idx;

-- (workspace_id) is a prefix of the UNIQUE workspace_folders_workspace_id_name_key
DROP INDEX IF EXISTS public.workspace_folders_workspace_id_idx;

-- ---------------------------------------------------------------------------
-- PART 2b: never-scanned indexes whose column is not a lookup key anywhere -
-- not in src/, not in any SECURITY DEFINER function body.
-- ---------------------------------------------------------------------------

-- site_url is only ever SELECTed and searched with ILIKE '%...%', which a plain
-- btree cannot serve. If site-search gets slow the answer is a trigram index,
-- not this one.
DROP INDEX IF EXISTS public.captures_site_url_idx;

-- dev_logs_drive_id is only ever written (insert_capture_by_email) and read back
-- with the row; never a WHERE key.
DROP INDEX IF EXISTS public.idx_captures_dev_logs_drive_id;

-- paywall_hits / checkout_status / extension_last_seen / referred_by_capture_id:
-- admin-only aggregates over a 35-row table; a seq scan is cheaper than the index.
DROP INDEX IF EXISTS public.idx_users_paywall_hits;
DROP INDEX IF EXISTS public.idx_users_checkout_status;
DROP INDEX IF EXISTS public.idx_users_extension_last_seen;
DROP INDEX IF EXISTS public.idx_users_referred_by_capture;

-- joined_at is returned by get_workspace_members but never filtered or sorted on.
DROP INDEX IF EXISTS public.workspace_members_joined_at_idx;

-- KEPT ON PURPOSE (do not "clean up" in a later pass):
--   users_email_lower_idx                      - invite_member_by_email keys on lower(email)
--   audit_logs_user_id_idx, idx_comments_user_id - user_id lookups, will be hit as data grows
--   idx_comment_spam_guard_last_post           - prune_ephemeral_data WHERE last_post_at < ...
--   google_drive_oauth_states_expires_at_idx   - prune_ephemeral_data WHERE expires_at < now()
--   idx_bugsnap_api_keys_*, captures_project_id_idx,
--   idx_google_drive_oauth_states_user_id,
--   idx_workspace_invites_invited_by           - all back foreign keys

COMMIT;
