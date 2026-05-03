DROP POLICY IF EXISTS "Admins manage verses insert" ON public.verses;
DROP POLICY IF EXISTS "Admins manage verses update" ON public.verses;

CREATE POLICY "Admins or superadmins manage verses insert"
ON public.verses FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins or superadmins manage verses update"
ON public.verses FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));