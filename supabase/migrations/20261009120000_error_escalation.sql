BEGIN;

ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS auto_escalate_errors boolean NOT NULL DEFAULT false;
ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS error_escalation_threshold integer NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS public.error_escalations (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  error_fingerprint text NOT NULL,
  last_escalated_count bigint NOT NULL,
  last_escalated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, error_fingerprint)
);

ALTER TABLE public.error_escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_escalations_select" ON public.error_escalations;

CREATE POLICY "error_escalations_select" ON public.error_escalations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = error_escalations.workspace_id AND w.owner_user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = error_escalations.workspace_id
        AND wm.user_id = (select auth.uid())
    )
  );

COMMIT;
