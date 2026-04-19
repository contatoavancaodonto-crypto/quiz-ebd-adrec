
-- ============ SOFT-DELETE FLAGS ============
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.verses ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- ============ CHURCHES ============
CREATE POLICY "Admins manage churches insert" ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage churches update" ON public.churches
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CLASSES ============
CREATE POLICY "Admins manage classes insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage classes update" ON public.classes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ QUIZZES ============
CREATE POLICY "Admins manage quizzes insert" ON public.quizzes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage quizzes update" ON public.quizzes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ QUESTIONS ============
CREATE POLICY "Admins manage questions insert" ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage questions update" ON public.questions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage questions delete" ON public.questions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ VERSES ============
CREATE POLICY "Admins manage verses insert" ON public.verses
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage verses update" ON public.verses
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ BADGES ============
CREATE POLICY "Admins manage badges insert" ON public.badges
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage badges update" ON public.badges
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES (admin can update any) ============
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PARTICIPANTS ============
CREATE POLICY "Admins manage participants update" ON public.participants
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ QUIZ_ATTEMPTS (admin delete) ============
CREATE POLICY "Admins can delete attempts" ON public.quiz_attempts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ SEASONS (admin insert) ============
CREATE POLICY "Admins can insert seasons" ON public.seasons
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SUGGESTIONS (admin read) ============
CREATE POLICY "Admins can read suggestions" ON public.suggestions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE: avatars (admin write) ============
CREATE POLICY "Admins can manage avatars"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE: class-materials (admin write) ============
CREATE POLICY "Admins can manage class materials storage"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'class-materials' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'class-materials' AND public.has_role(auth.uid(), 'admin'));
