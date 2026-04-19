ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.current_admin_church_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND role = 'admin'
  LIMIT 1
$$;
