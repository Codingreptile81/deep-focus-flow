
-- Add subject_id, estimate_minutes, actual_minutes to tasks
ALTER TABLE public.tasks ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN estimate_minutes integer;
ALTER TABLE public.tasks ADD COLUMN actual_minutes integer NOT NULL DEFAULT 0;

-- Add task_id to session_logs
ALTER TABLE public.session_logs ADD COLUMN task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
