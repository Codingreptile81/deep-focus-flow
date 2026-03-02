
-- Create storage bucket for task resource files
INSERT INTO storage.buckets (id, name, public) VALUES ('task-resources', 'task-resources', true);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload task resource files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Task resource files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-resources');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own task resource files"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-resources' AND auth.uid()::text = (storage.foldername(name))[1]);
