
-- Add google_calendar_id to tasks table
ALTER TABLE public.tasks ADD COLUMN google_calendar_id text;

-- Create google_tokens table for storing OAuth tokens
CREATE TABLE public.google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own google_tokens" ON public.google_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own google_tokens" ON public.google_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own google_tokens" ON public.google_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own google_tokens" ON public.google_tokens FOR DELETE USING (auth.uid() = user_id);

-- Create google_calendar_sync table for sync metadata
CREATE TABLE public.google_calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  sync_enabled boolean NOT NULL DEFAULT true,
  calendar_id text NOT NULL DEFAULT 'primary',
  last_sync_at timestamp with time zone,
  sync_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own google_calendar_sync" ON public.google_calendar_sync FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own google_calendar_sync" ON public.google_calendar_sync FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own google_calendar_sync" ON public.google_calendar_sync FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own google_calendar_sync" ON public.google_calendar_sync FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage google_tokens (for edge functions)
CREATE POLICY "Service role can manage google_tokens" ON public.google_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage google_calendar_sync" ON public.google_calendar_sync FOR ALL USING (true) WITH CHECK (true);
