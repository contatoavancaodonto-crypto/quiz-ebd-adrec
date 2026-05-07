
UPDATE storage.buckets SET public = false WHERE id = 'support';

-- Drop existing permissive policies on support bucket
DROP POLICY IF EXISTS "Support files publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Support upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "Support read own or superadmin" ON storage.objects;
DROP POLICY IF EXISTS "Support delete own or superadmin" ON storage.objects;

CREATE POLICY "Support read own or superadmin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Support upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Support delete own or superadmin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);
