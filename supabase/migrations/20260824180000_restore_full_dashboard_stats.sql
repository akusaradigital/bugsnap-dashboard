-- =====================================================================
-- 20260824180000_restore_full_dashboard_stats.sql
-- Restores complete dashboard_stats payload (totals, week, top_contributors, recent)
-- with secure search_path = public, pg_temp
-- =====================================================================

DROP FUNCTION IF EXISTS public.dashboard_stats(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.dashboard_stats(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_ws uuid := p_workspace_id;
  v_totals jsonb;
  v_week jsonb;
  v_top jsonb;
  v_recent jsonb;
BEGIN
  IF v_ws IS NULL THEN
    SELECT w.id INTO v_ws
    FROM public.workspaces w
    WHERE w.owner_user_id = auth.uid()
       OR EXISTS (SELECT 1 FROM public.workspace_members wm
                  WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid())
    ORDER BY w.created_at ASC
    LIMIT 1;
  END IF;

  IF v_ws IS NULL THEN
    RETURN jsonb_build_object(
      'counts_exact', true,
      'totals', jsonb_build_object('total_count', 0, 'video_count', 0, 'screenshot_count', 0, 'week_count', 0),
      'week', jsonb_build_object('new_this_week_owner', 0, 'day_counts', '[]'::jsonb),
      'top_contributors', '[]'::jsonb,
      'recent', '[]'::jsonb
    );
  END IF;

  -- Verify workspace access
  SELECT w.id INTO v_ws
  FROM public.workspaces w
  WHERE w.id = v_ws
    AND (w.owner_user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.workspace_members wm
                    WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()))
  LIMIT 1;

  IF v_ws IS NULL THEN
    RETURN jsonb_build_object(
      'counts_exact', true,
      'totals', jsonb_build_object('total_count', 0, 'video_count', 0, 'screenshot_count', 0, 'week_count', 0),
      'week', jsonb_build_object('new_this_week_owner', 0, 'day_counts', '[]'::jsonb),
      'top_contributors', '[]'::jsonb,
      'recent', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'total_count',  count(*),
    'video_count',  count(*) FILTER (WHERE type = 'video'),
    'screenshot_count', count(*) FILTER (WHERE type = 'screenshot'),
    'week_count',   count(*) FILTER (WHERE created_at >= now() - interval '7 days')
  ) INTO v_totals
  FROM public.captures
  WHERE workspace_id = v_ws;

  SELECT jsonb_build_object(
    'new_this_week_owner', count(*) FILTER (WHERE created_at >= now() - interval '7 days' AND lower(owner_email) = v_email),
    'day_counts', (
      SELECT jsonb_agg(d) FROM (
        SELECT to_char(day, 'Dy') AS label,
               count(c.id) FILTER (WHERE lower(c.owner_email) = v_email) AS owner_count,
               count(c.id) AS all_count
        FROM generate_series(
          date_trunc('day', now()) - interval '6 days',
          date_trunc('day', now()),
          interval '1 day'
        ) AS day
        LEFT JOIN public.captures c
          ON c.workspace_id = v_ws
         AND c.created_at >= day
         AND c.created_at < day + interval '1 day'
        GROUP BY day
        ORDER BY day
      ) d
    )
  ) INTO v_week
  FROM public.captures
  WHERE workspace_id = v_ws;

  SELECT coalesce(jsonb_agg(t), '[]'::jsonb) INTO v_top
  FROM (
    SELECT jsonb_build_object('email', lower(owner_email), 'count', count(*)) AS t
    FROM public.captures
    WHERE workspace_id = v_ws AND owner_email IS NOT NULL
    GROUP BY lower(owner_email)
    ORDER BY count(*) DESC
    LIMIT 5
  ) x;

  SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO v_recent
  FROM (
    SELECT id, title, type, drive_url, created_at, workspace_id,
           owner_email, duration, tag, folder_name
    FROM public.captures
    WHERE workspace_id = v_ws
    ORDER BY created_at DESC
    LIMIT 5
  ) r;

  RETURN jsonb_build_object(
    'workspace_id', v_ws,
    'counts_exact', true,
    'totals', v_totals,
    'week', v_week,
    'top_contributors', v_top,
    'recent', v_recent
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dashboard_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_stats(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;
