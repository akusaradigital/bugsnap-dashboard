-- Each extension install now pairs its own secret, keyed by (user_id, device_id),
-- instead of overwriting a single extension_secret_hash per user. Previously one
-- user connecting Google Drive on a second laptop invalidated the first laptop's
-- pairing, which surfaced to that user as a false "Google Drive session expired"
-- error even though the underlying Drive grant (google_drive_connections) was
-- still perfectly valid.
CREATE TABLE IF NOT EXISTS public.extension_device_connections (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  extension_secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS extension_device_connections_user_id_idx
  ON public.extension_device_connections (user_id);

ALTER TABLE public.extension_device_connections ENABLE ROW LEVEL SECURITY;

-- No policies: only the service-role client (the extension/drive-connect API
-- route) ever reads or writes this table. anon/authenticated get nothing.

-- The old per-user secret column is superseded by the table above and no
-- longer written to, but is kept for now rather than dropped, in case any
-- in-flight extension install still carries a secret paired under the old
-- scheme and needs one more successful refresh to pick up the new one.
