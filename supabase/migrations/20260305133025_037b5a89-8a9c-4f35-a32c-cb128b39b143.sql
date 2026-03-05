
-- Drop overly permissive service role policies (service role bypasses RLS by default)
DROP POLICY "Service role can manage google_tokens" ON public.google_tokens;
DROP POLICY "Service role can manage google_calendar_sync" ON public.google_calendar_sync;
