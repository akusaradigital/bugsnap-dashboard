-- =====================================================================
-- Restrict app_settings RLS.
--
-- 011_app_settings.sql created `for select using (true)`, on the assumption
-- the table only held the promo banner. It now also holds support_tickets,
-- security_audit_logs (with client IPs) and extension_recent_errors, all of
-- which were world-readable with the public anon key.
--
-- Every server reader of this table uses the service role, which bypasses
-- RLS, so dropping the public policy changes no application behaviour.
-- =====================================================================

drop policy if exists "app_settings public read" on public.app_settings;
drop policy if exists "app_settings public read whitelist" on public.app_settings;

-- Only the promo banner and extension config are genuinely public. Keep them
-- readable in case a client ever reads them directly with the anon key.
create policy "app_settings public read whitelist" on public.app_settings
  for select using (key in ('promo_banner', 'extension_config'));
