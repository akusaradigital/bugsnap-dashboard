CREATE TABLE IF NOT EXISTS public.uninstall_feedback (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL DEFAULT '',
  user_email TEXT,
  extension_version TEXT,
  browser TEXT,
  os TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uninstall_feedback_created_at_idx
  ON public.uninstall_feedback (created_at DESC);

ALTER TABLE public.uninstall_feedback ENABLE ROW LEVEL SECURITY;

-- No policies: this table is written only via the service-role client in
-- /api/uninstall-feedback (public, unauthenticated POST since there is no
-- active session by the time a user uninstalls) and read only via the
-- admin API routes, also service-role. anon/authenticated get nothing.
