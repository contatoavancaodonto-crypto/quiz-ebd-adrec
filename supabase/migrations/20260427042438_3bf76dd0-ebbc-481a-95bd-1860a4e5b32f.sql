-- 1) Coluna para "ocultar" usuário do app sem mexer no auth
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_hidden_at ON public.profiles(hidden_at);

-- 2) DELETE policies para Superadmin nas entidades editáveis
DO $$
BEGIN
  -- churches
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='churches' AND policyname='Superadmin can delete churches') THEN
    CREATE POLICY "Superadmin can delete churches" ON public.churches
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;

  -- classes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='classes' AND policyname='Superadmin can delete classes') THEN
    CREATE POLICY "Superadmin can delete classes" ON public.classes
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;

  -- quizzes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quizzes' AND policyname='Superadmin can delete quizzes') THEN
    CREATE POLICY "Superadmin can delete quizzes" ON public.quizzes
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;

  -- verses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verses' AND policyname='Superadmin can delete verses') THEN
    CREATE POLICY "Superadmin can delete verses" ON public.verses
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;

  -- badges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='badges' AND policyname='Superadmin can delete badges') THEN
    CREATE POLICY "Superadmin can delete badges" ON public.badges
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;

  -- seasons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='seasons' AND policyname='Superadmin can delete seasons') THEN
    CREATE POLICY "Superadmin can delete seasons" ON public.seasons
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;

  -- participants
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='participants' AND policyname='Superadmin can delete participants') THEN
    CREATE POLICY "Superadmin can delete participants" ON public.participants
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;