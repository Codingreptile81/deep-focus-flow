
-- Add parent_task_id for sub-task support
ALTER TABLE public.tasks ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE DEFAULT NULL;

-- Index for fast sub-task lookups
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
