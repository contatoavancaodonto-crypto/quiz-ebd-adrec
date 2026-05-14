-- Adicionar política para permitir superadmins inserirem igrejas
CREATE POLICY "Superadmins can insert churches"
ON public.churches
FOR INSERT
WITH CHECK (
  (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin' LIMIT 1) IS NOT NULL
);

-- Garantir que a política de solicitação de novas igrejas continue funcionando para usuários comuns
-- e não entre em conflito com a de superadmin
ALTER POLICY "Anyone can request a new church" 
ON public.churches 
TO authenticated;
