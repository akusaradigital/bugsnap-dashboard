-- One-time codes that let a signed-in web session pair the extension without an
-- OAuth round-trip. Only the SHA-256 of the code is stored; the plaintext is shown
-- to the page once and sent to the extension via postMessage.
CREATE TABLE IF NOT EXISTS public.extension_pairing_codes (
  code_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS extension_pairing_codes_user_id_idx
  ON public.extension_pairing_codes (user_id);

ALTER TABLE public.extension_pairing_codes ENABLE ROW LEVEL SECURITY;

-- No policies: only the service-role client (the pairing API routes) reads or writes it.
