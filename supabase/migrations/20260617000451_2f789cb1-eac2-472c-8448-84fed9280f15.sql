-- =========================================================
-- 1) ANSWERS: bloqueia leitura pública do is_correct
-- =========================================================
DROP POLICY IF EXISTS "Answers are publicly readable" ON public.answers;

CREATE POLICY "Users read own answers"
ON public.answers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.participants p ON p.id = qa.participant_id
    WHERE qa.id = answers.attempt_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins read all answers"
ON public.answers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

REVOKE SELECT ON public.answers FROM anon;

-- =========================================================
-- 2) QUIZ_ATTEMPTS: leitura restrita; ranking usa finalizadas
-- =========================================================
DROP POLICY IF EXISTS "Attempts are publicly readable" ON public.quiz_attempts;

CREATE POLICY "Users read own attempts"
ON public.quiz_attempts FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.participants p
          WHERE p.id = quiz_attempts.participant_id AND p.user_id = auth.uid())
);

-- Necessário para que as views de ranking (security_invoker) funcionem para autenticados
CREATE POLICY "Authenticated read finalized attempts"
ON public.quiz_attempts FOR SELECT TO authenticated
USING (finished_at IS NOT NULL);

CREATE POLICY "Admins read all attempts"
ON public.quiz_attempts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

REVOKE SELECT ON public.quiz_attempts FROM anon;

-- =========================================================
-- 3) PARTICIPANTS: somente autenticados
-- =========================================================
DROP POLICY IF EXISTS "Participants are publicly readable" ON public.participants;

CREATE POLICY "Authenticated read participants"
ON public.participants FOR SELECT TO authenticated
USING (true);

REVOKE SELECT ON public.participants FROM anon;

-- =========================================================
-- 4) CHURCHES: oculta dados sensíveis do solicitante
-- =========================================================
-- Mantém política pública de approved=true, mas tira colunas sensíveis do role público
REVOKE SELECT ON public.churches FROM anon, authenticated;

GRANT SELECT (
  id, name, pastor_president, approved, requested, active, created_at
) ON public.churches TO anon, authenticated;

-- Admins/superadmins precisam de tudo — usam service_role via RPC ou função definer
GRANT SELECT ON public.churches TO service_role;

-- RPC para admins lerem colunas sensíveis quando necessário
CREATE OR REPLACE FUNCTION public.admin_get_churches_full()
RETURNS SETOF public.churches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.churches ORDER BY name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_churches_full() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_churches_full() TO authenticated;

-- =========================================================
-- 5) QUESTIONS: esconde correct_option/explanation do cliente
-- =========================================================
REVOKE SELECT ON public.questions FROM anon, authenticated;

GRANT SELECT (
  id, quiz_id, lesson_id, question_text,
  option_a, option_b, option_c, option_d,
  order_index, active, created_at
) ON public.questions TO authenticated;

GRANT ALL ON public.questions TO service_role;

-- Admins continuam acessando o gabarito via RPC já existente:
-- public.admin_get_questions_with_answer(p_quiz_id uuid)

-- =========================================================
-- 6) POSTS / POST_COMMENTS: remove políticas duplicadas
-- =========================================================
DROP POLICY IF EXISTS "Posts viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
-- Mantém apenas as políticas restritas:
--   "Posts are viewable by everyone if approved" e
--   "Comments are viewable by everyone if approved"

-- =========================================================
-- 7) Converter views de ranking para SECURITY INVOKER
-- =========================================================
ALTER VIEW public.ranking_lesson SET (security_invoker = on);
ALTER VIEW public.ranking_churches_classic SET (security_invoker = on);
ALTER VIEW public.ranking_trimester_consolidated SET (security_invoker = on);