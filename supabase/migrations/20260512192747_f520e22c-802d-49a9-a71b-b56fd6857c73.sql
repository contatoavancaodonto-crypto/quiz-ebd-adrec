-- Atualizar políticas da tabela email_templates para permitir acesso a administradores também
DROP POLICY IF EXISTS "Templates são visíveis por superadmins" ON public.email_templates;
CREATE POLICY "Templates são visíveis por superadmins e admins" 
ON public.email_templates 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Templates são editáveis por superadmins" ON public.email_templates;
CREATE POLICY "Templates são editáveis por superadmins e admins" 
ON public.email_templates 
FOR UPDATE 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Templates são inseríveis por superadmins" ON public.email_templates;
CREATE POLICY "Templates são inseríveis por superadmins e admins" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));