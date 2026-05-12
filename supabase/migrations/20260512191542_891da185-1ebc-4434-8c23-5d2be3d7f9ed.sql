-- Drop existing policies that use recursive EXISTS checks
DROP POLICY IF EXISTS "Templates são visíveis por superadmins" ON public.email_templates;
DROP POLICY IF EXISTS "Templates são editáveis por superadmins" ON public.email_templates;
DROP POLICY IF EXISTS "Templates são inseríveis por superadmins" ON public.email_templates;

-- Create new policies using has_role function to avoid RLS recursion
CREATE POLICY "Templates são visíveis por superadmins" 
ON public.email_templates 
FOR SELECT 
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Templates são editáveis por superadmins" 
ON public.email_templates 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Templates são inseríveis por superadmins" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));