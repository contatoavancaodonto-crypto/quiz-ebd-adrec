
DROP FUNCTION IF EXISTS public.submit_answer(uuid, uuid, text);

CREATE FUNCTION public.submit_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected_option text
)
RETURNS TABLE(is_correct boolean, correct_option text)
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

  IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
    RAISE EXCEPTION 'Invalid option';
  END IF;

  SELECT finished_at INTO v_finished
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
  END IF;

  SELECT q.correct_option INTO v_correct
  FROM public.questions q
  WHERE q.id = p_question_id;

  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

  INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
  VALUES (p_attempt_id, p_question_id, UPPER(p_selected_option), v_is_correct);

  RETURN QUERY SELECT v_is_correct, v_correct;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text) TO authenticated;
