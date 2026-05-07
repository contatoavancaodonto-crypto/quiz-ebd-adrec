
-- ===== profiles =====
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- ===== quiz_attempts =====
DROP POLICY IF EXISTS "Anyone can create attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Anyone can update attempts" ON public.quiz_attempts;

CREATE POLICY "Authenticated can create attempts"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Permite finalizar uma tentativa (escrever score uma única vez), mas
-- bloqueia mexer em tentativas já finalizadas. Admins podem ajustar.
CREATE POLICY "Authenticated can finalize own attempt"
  ON public.quiz_attempts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (finished_at IS NULL OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===== answers =====
DROP POLICY IF EXISTS "Anyone can create answers" ON public.answers;
CREATE POLICY "Authenticated can create answers"
  ON public.answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===== participants =====
DROP POLICY IF EXISTS "Anyone can create participants" ON public.participants;
CREATE POLICY "Authenticated can create participants"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===== class_materials =====
DROP POLICY IF EXISTS "Authenticated users can insert class materials" ON public.class_materials;
DROP POLICY IF EXISTS "Authenticated users can update class materials" ON public.class_materials;
DROP POLICY IF EXISTS "Authenticated users can delete class materials" ON public.class_materials;

CREATE POLICY "Admins manage class materials insert"
  ON public.class_materials FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins manage class materials update"
  ON public.class_materials FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins manage class materials delete"
  ON public.class_materials FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- ===== daily_verse =====
DROP POLICY IF EXISTS "Anyone can insert daily verse" ON public.daily_verse;
CREATE POLICY "Service or admin inserts daily verse"
  ON public.daily_verse FOR INSERT
  TO public
  WITH CHECK (
    auth.role() = 'service_role'
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
  );
