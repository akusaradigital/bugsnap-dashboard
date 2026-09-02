-- 20260902100000_bugsnap_api_keys.sql
-- Inbound API Keys for BugSnap public captures API

CREATE TABLE IF NOT EXISTS public.bugsnap_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bugsnap_api_keys_workspace_id ON public.bugsnap_api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bugsnap_api_keys_hash_active ON public.bugsnap_api_keys(key_hash) WHERE revoked_at IS NULL;

-- Enable RLS (Service role only access, no client direct policies)
ALTER TABLE public.bugsnap_api_keys ENABLE ROW LEVEL SECURITY;

-- Allow 'api' as a valid source in captures table
ALTER TABLE public.captures DROP CONSTRAINT IF EXISTS captures_source_check;
ALTER TABLE public.captures ADD CONSTRAINT captures_source_check CHECK (source IN ('chrome_extension', 'web_upload', 'api'));
