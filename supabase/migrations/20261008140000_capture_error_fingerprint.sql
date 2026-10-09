-- Error fingerprint: collapses the same bug reported by many people into one
-- identity, so a capture list can be prioritised by frequency.
--
-- The value is computed in the app (src/lib/fingerprint.ts) from dev_logs and
-- passed in, rather than derived in SQL: the normalization needs stack-frame
-- parsing and route rules that belong in tested TypeScript, not in plpgsql.
--
-- NULL is a valid and expected value. A capture of a layout glitch has no error
-- to group on, and those must stay ungrouped rather than collapsing into one
-- bucket - every count query below therefore excludes NULL explicitly.

BEGIN;

ALTER TABLE public.captures
  ADD COLUMN IF NOT EXISTS error_fingerprint text;

COMMENT ON COLUMN public.captures.error_fingerprint IS
  'Grouping key for the same underlying error (FNV-1a of normalized message + top app stack frame + route). NULL when the capture carries no error. Not a security value.';

-- Grouping is always scoped to a workspace: a fingerprint is only ever compared
-- against captures the same team can see, which also bounds the blast radius of
-- a hash collision to one workspace's list.
-- Partial index: NULL fingerprints are the majority on non-error captures and
-- are never grouped, so they are kept out of the index entirely.
CREATE INDEX IF NOT EXISTS idx_captures_workspace_fingerprint
  ON public.captures (workspace_id, error_fingerprint, created_at DESC)
  WHERE error_fingerprint IS NOT NULL;

-- Accept the fingerprint on insert. Signature gains one trailing parameter with
-- a DEFAULT, so existing 13-argument callers keep working unchanged.
CREATE OR REPLACE FUNCTION public.insert_capture_by_email(
  p_owner_email text,
  p_title text DEFAULT 'Untitled'::text,
  p_type text DEFAULT 'screenshot'::text,
  p_drive_url text DEFAULT ''::text,
  p_dev_logs jsonb DEFAULT '[]'::jsonb,
  p_window_size text DEFAULT NULL::text,
  p_description text DEFAULT NULL::text,
  p_duration integer DEFAULT NULL::integer,
  p_os text DEFAULT NULL::text,
  p_browser text DEFAULT NULL::text,
  p_site_url text DEFAULT NULL::text,
  p_folder_name text DEFAULT NULL::text,
  p_workspace_id uuid DEFAULT NULL::uuid,
  p_error_fingerprint text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id      UUID;
  v_workspace_id UUID;
  v_capture_id   UUID;
  v_role         TEXT;
  v_email_norm   TEXT := LOWER(TRIM(p_owner_email));
  v_folder_clean TEXT := NULLIF(TRIM(p_folder_name), '');
  v_logs_file_id TEXT := NULL;
  v_fingerprint  TEXT := NULLIF(TRIM(p_error_fingerprint), '');
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'owner_email is required' USING ERRCODE = '23502';
  END IF;

  SELECT prov.out_user_id, prov.out_workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  IF v_user_id IS NULL OR v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Unable to initialize account for %', v_email_norm USING ERRCODE = 'P0002';
  END IF;

  IF p_workspace_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.workspace_members wm
      WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
    ) THEN
      v_workspace_id := p_workspace_id;
    END IF;
  END IF;

  SELECT role INTO v_role FROM public.workspace_members WHERE workspace_id = v_workspace_id AND user_id = v_user_id;
  IF v_role = 'viewer' THEN
    RAISE EXCEPTION 'Viewers cannot create captures' USING ERRCODE = '42501';
  END IF;

  IF v_folder_clean IS NOT NULL AND v_folder_clean <> 'No folder' THEN
    INSERT INTO public.workspace_folders (workspace_id, name, is_default)
    VALUES (v_workspace_id, v_folder_clean, FALSE)
    ON CONFLICT (workspace_id, name) DO NOTHING;
  END IF;

  -- Extract dev_logs_drive_id if provided in jsonb payload
  IF p_dev_logs IS NOT NULL AND jsonb_typeof(p_dev_logs) = 'object' AND p_dev_logs ? 'driveFileId' THEN
    v_logs_file_id := p_dev_logs->>'driveFileId';
  END IF;

  -- Guard against a malformed value reaching the grouping key. The app emits
  -- 8 lowercase hex chars; anything else is dropped rather than stored, so a
  -- bad client cannot create junk groups.
  IF v_fingerprint IS NOT NULL AND v_fingerprint !~ '^[0-9a-f]{8}$' THEN
    v_fingerprint := NULL;
  END IF;

  INSERT INTO public.captures (
    workspace_id, user_id, owner_email, title, type, drive_url, dev_logs, window_size, description, duration, os, browser, site_url, folder_name, dev_logs_drive_id, error_fingerprint
  ) VALUES (
    v_workspace_id, v_user_id, v_email_norm,
    COALESCE(NULLIF(TRIM(p_title), ''), 'Untitled'),
    p_type,
    p_drive_url,
    COALESCE(p_dev_logs, '[]'::jsonb),
    p_window_size,
    p_description,
    p_duration,
    p_os,
    p_browser,
    p_site_url,
    v_folder_clean,
    v_logs_file_id,
    v_fingerprint
  )
  RETURNING id INTO v_capture_id;

  RETURN v_capture_id;
END;
$function$;

-- Same grant posture as the 13-arg version: extension traffic goes through the
-- server route that verifies a Google token, never straight from the client.
REVOKE EXECUTE ON FUNCTION public.insert_capture_by_email(text, text, text, text, jsonb, text, text, integer, text, text, text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insert_capture_by_email(text, text, text, text, jsonb, text, text, integer, text, text, text, text, uuid, text) TO service_role;

-- Drop the old 13-argument overload. Leaving both in place makes every call
-- ambiguous to PostgREST, which resolves overloads by argument names.
DROP FUNCTION IF EXISTS public.insert_capture_by_email(text, text, text, text, jsonb, text, text, integer, text, text, text, text, uuid);

-- How many other captures in this workspace share one capture's error.
-- SECURITY INVOKER on purpose: it runs as the caller, so RLS on captures
-- decides what is visible and this cannot leak across workspaces.
CREATE OR REPLACE FUNCTION public.get_capture_occurrences(p_capture_id uuid)
RETURNS TABLE (occurrences bigint, first_seen timestamptz, last_seen timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COUNT(*)::bigint, MIN(c.created_at), MAX(c.created_at)
  FROM public.captures c
  WHERE c.error_fingerprint IS NOT NULL
    AND c.error_fingerprint = (
      SELECT error_fingerprint FROM public.captures WHERE id = p_capture_id
    )
    AND c.workspace_id = (
      SELECT workspace_id FROM public.captures WHERE id = p_capture_id
    );
$function$;

GRANT EXECUTE ON FUNCTION public.get_capture_occurrences(uuid) TO authenticated;

COMMIT;
