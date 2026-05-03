-- Quizzes: Permitir Superadmin nos comandos administrativos
DROP POLICY IF EXISTS "Admins manage quizzes insert" ON public.quizzes;
CREATE POLICY "Admins and superadmins manage quizzes insert" 
ON public.quizzes FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Admins manage quizzes update" ON public.quizzes;
CREATE POLICY "Admins and superadmins manage quizzes update" 
ON public.quizzes FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Questions: Permitir Superadmin nos comandos administrativos
DROP POLICY IF EXISTS "Admins manage questions insert" ON public.questions;
CREATE POLICY "Admins and superadmins manage questions insert" 
ON public.questions FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Admins manage questions update" ON public.questions;
CREATE POLICY "Admins and superadmins manage questions update" 
ON public.questions FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Admins manage questions delete" ON public.questions;
CREATE POLICY "Admins and superadmins manage questions delete" 
ON public.questions FOR DELETE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Classes: Permitir Superadmin nos comandos administrativos
DROP POLICY IF EXISTS "Admins manage classes insert" ON public.classes;
CREATE POLICY "Admins and superadmins manage classes insert" 
ON public.classes FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Admins manage classes update" ON public.classes;
CREATE POLICY "Admins and superadmins manage classes update" 
ON public.classes FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Badges: Permitir Superadmin nos comandos administrativos
DROP POLICY IF EXISTS "Admins manage badges insert" ON public.badges;
CREATE POLICY "Admins and superadmins manage badges insert" 
ON public.badges FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Admins manage badges update" ON public.badges;
CREATE POLICY "Admins and superadmins manage badges update" 
ON public.badges FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));