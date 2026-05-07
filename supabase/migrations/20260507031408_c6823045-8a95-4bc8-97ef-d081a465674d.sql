DROP POLICY IF EXISTS "Authenticated users upload support files" ON storage.objects;

CREATE POLICY "Authenticated users upload support files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);