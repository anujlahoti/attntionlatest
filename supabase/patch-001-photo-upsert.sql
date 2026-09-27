-- Run this once if you already ran schema.sql before this policy was added.
-- Lets a user replace their weekly photo (uploads use upsert).
create policy "Users update own files" on storage.objects for update using (
  bucket_id = 'session-files' and auth.uid()::text = (storage.foldername(name))[1]
);
