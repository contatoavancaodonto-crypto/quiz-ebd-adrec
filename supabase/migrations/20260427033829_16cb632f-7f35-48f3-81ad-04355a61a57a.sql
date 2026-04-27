-- 1) CHURCHES: remove UPDATE amplo por qualquer admin; só superadmin pode editar igrejas diretamente
DROP POLICY IF EXISTS "Admins manage churches update" ON public.churches;

CREATE POLICY "Superadmin can update churches"
ON public.churches
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

-- (mantém) "Admins manage churches insert" — necessário para criar novas igrejas; só superadmin terá esse role na prática

-- 2) USER_ROLES: na promoção, validar que o usuário promovido pertence à mesma igreja do admin
DROP POLICY IF EXISTS "Church admin can promote members of own church" ON public.user_roles;

CREATE POLICY "Church admin can promote members of own church"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND role = 'admin'::app_role
  AND church_id IS NOT NULL
  AND church_id = public.current_admin_church_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_roles.user_id
      AND p.church_id = public.current_admin_church_id()
  )
);