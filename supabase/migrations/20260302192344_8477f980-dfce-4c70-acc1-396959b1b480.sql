
CREATE TABLE public.task_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'text', -- 'text', 'link', 'file'
  title TEXT NOT NULL,
  content TEXT, -- text content or URL or file path
  file_url TEXT, -- storage URL for files
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task_resources" ON public.task_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task_resources" ON public.task_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task_resources" ON public.task_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task_resources" ON public.task_resources FOR DELETE USING (auth.uid() = user_id);
