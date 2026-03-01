
ALTER TABLE public.tasks ADD COLUMN recurrence TEXT DEFAULT NULL;
-- recurrence values: null (no repeat), 'daily', 'weekly'
