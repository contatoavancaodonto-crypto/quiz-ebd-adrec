
-- 1. Restrict SELECT on questions to authenticated and revoke correct_option column from anon/authenticated.
DROP POLICY IF EXISTS "Questions are publicly readable" ON public.questions;

CREATE POLICY "Questions readable by authenticated"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

-- Column-level: nobody (anon/authenticated) may read correct_option directly.
REVOKE SELECT (correct_option) ON public.questions FROM anon, authenticated, PUBLIC;

-- 2. submit_answer RPC: grades server-side using the hidden correct_option.
CREATE OR REPLACE FUNCTION public.submit_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected_option text
)
RETURNS TABLE(is_correct boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct text;
  v_is_correct boolean;
  v_finished timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_selected_option NOT IN ('A','B','C','D') THEN
    RAISE EXCEPTION 'Invalid option';
  END IF;

  SELECT finished_at INTO v_finished
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
  END IF;

  SELECT correct_option INTO v_correct
  FROM public.questions
  WHERE id = p_question_id;

  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

  INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
  VALUES (p_attempt_id, p_question_id, UPPER(p_selected_option), v_is_correct);

  RETURN QUERY SELECT v_is_correct;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text) TO authenticated;

-- 3. get_attempt_gabarito RPC: returns review only after attempt is finalized.
CREATE OR REPLACE FUNCTION public.get_attempt_gabarito(p_attempt_id uuid)
RETURNS TABLE(
  question_id uuid,
  order_index integer,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option text,
  selected_option text,
  is_correct boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_finished timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT finished_at INTO v_finished
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  IF v_finished IS NULL THEN
    RAISE EXCEPTION 'Attempt not finalized yet';
  END IF;

  RETURN QUERY
  SELECT
    q.id AS question_id,
    q.order_index,
    q.question_text,
    q.option_a, q.option_b, q.option_c, q.option_d,
    q.correct_option,
    a.selected_option,
    a.is_correct
  FROM public.answers a
  JOIN public.questions q ON q.id = a.question_id
  WHERE a.attempt_id = p_attempt_id
  ORDER BY q.order_index ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_attempt_gabarito(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attempt_gabarito(uuid) TO authenticated;

-- 4. admin_get_questions_with_answer RPC: admins/superadmins only.
CREATE OR REPLACE FUNCTION public.admin_get_questions_with_answer(p_quiz_id uuid)
RETURNS TABLE(
  id uuid,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option text,
  order_index integer,
  explanation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
         q.correct_option, q.order_index, q.explanation
  FROM public.questions q
  WHERE q.quiz_id = p_quiz_id
  ORDER BY q.order_index ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_questions_with_answer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_questions_with_answer(uuid) TO authenticated;
