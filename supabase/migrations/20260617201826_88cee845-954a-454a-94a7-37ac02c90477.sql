
DROP POLICY IF EXISTS "Admins can insert seasons" ON public.seasons;
DROP POLICY IF EXISTS "Only admins can update seasons" ON public.seasons;

CREATE POLICY "Admins can insert seasons" ON public.seasons
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Admins can update seasons" ON public.seasons
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));
