
-- 1. class-materials storage: restrict to admin/superadmin
DROP POLICY IF EXISTS "Authenticated can upload class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete class materials" ON storage.objects;

CREATE POLICY "Admins/superadmins can upload class materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'class-materials'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);

CREATE POLICY "Admins/superadmins can update class materials"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'class-materials'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);

CREATE POLICY "Admins/superadmins can delete class materials"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'class-materials'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);

-- 2. email_queue: replace hardcoded email policy with role-based superadmin check
DROP POLICY IF EXISTS "Admins can view email queue" ON public.email_queue;

CREATE POLICY "Superadmins can view email queue"
ON public.email_queue FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));
