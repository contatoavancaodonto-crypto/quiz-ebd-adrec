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
SET search_path TO 'public'
AS $$
DECLARE
  v_finished timestamptz;
  v_owner uuid;
  v_lesson_id uuid;
  v_questions_json jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT qa.finished_at, p.user_id, COALESCE(qa.lesson_id, qa.quiz_id)
    INTO v_finished, v_owner, v_lesson_id
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  IF NOT (v_owner = auth.uid()
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'superadmin'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_finished IS NULL THEN
    RAISE EXCEPTION 'Attempt not finalized yet';
  END IF;

  SELECT questions INTO v_questions_json FROM public.lessons WHERE id = v_lesson_id;

  RETURN QUERY
  SELECT
    q.id,
    q.order_index::integer, -- Cast explícito para garantir integer
    q.question_text,
    q.option_a, q.option_b, q.option_c, q.option_d,
    q.correct_option,
    a.selected_option,
    a.is_correct
  FROM public.answers a
  JOIN public.questions q ON q.id = a.question_id
  WHERE a.attempt_id = p_attempt_id AND a.question_id IS NOT NULL

  UNION ALL

  SELECT
    NULL::uuid AS id,
    COALESCE((qj.value->>'order_index')::integer, qj.ord::integer) AS order_index,
    COALESCE(qj.value->>'pergunta', qj.value->>'question_text', qj.value->>'text') AS question_text,
    COALESCE(qj.value->'alternativas'->>'a', qj.value->>'option_a') AS option_a,
    COALESCE(qj.value->'alternativas'->>'b', qj.value->>'option_b') AS option_b,
    COALESCE(qj.value->'alternativas'->>'c', qj.value->>'option_c') AS option_c,
    COALESCE(qj.value->'alternativas'->>'d', qj.value->>'option_d') AS option_d,
    UPPER(COALESCE(qj.value->>'respostaCorreta', qj.value->>'correct_option', qj.value->>'correctOption')) AS correct_option,
    a.selected_option,
    a.is_correct
  FROM public.answers a
  CROSS JOIN LATERAL (
    -- Usando ordinality que retorna bigint, precisamos de cast para integer
    SELECT value, (ord - 1)::integer AS ord
    FROM jsonb_array_elements(COALESCE(v_questions_json, '[]'::jsonb)) WITH ORDINALITY AS t(value, ord)
    WHERE (value->>'id') = a.question_ref
  ) qj
  WHERE a.attempt_id = p_attempt_id AND a.question_id IS NULL AND a.question_ref IS NOT NULL
  ORDER BY 2 ASC;
END;
$$;
