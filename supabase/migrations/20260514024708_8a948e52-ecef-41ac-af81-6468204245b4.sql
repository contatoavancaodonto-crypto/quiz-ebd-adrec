
-- 1. Drop função antiga sobrecarregada
DROP FUNCTION IF EXISTS public.submit_answer(uuid, uuid, text);

-- 2. Permitir question_id NULL e adicionar question_ref
ALTER TABLE public.answers ALTER COLUMN question_id DROP NOT NULL;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS question_ref text;

-- Garantir uniqueness por tentativa+pergunta (uuid OU ref)
DROP INDEX IF EXISTS answers_attempt_question_uniq;
CREATE UNIQUE INDEX IF NOT EXISTS answers_attempt_question_uniq
  ON public.answers (attempt_id, COALESCE(question_id::text, question_ref));

-- 3. Reescrever submit_answer (única versão: text)
CREATE OR REPLACE FUNCTION public.submit_answer(
  p_attempt_id uuid,
  p_question_id text,
  p_selected_option text
)
RETURNS TABLE(is_correct boolean, correct_option text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_correct text;
  v_is_correct boolean;
  v_finished timestamptz;
  v_owner uuid;
  v_lesson_id uuid;
  v_questions_json jsonb;
  v_q_json jsonb;
  v_question_uuid uuid;
  v_is_uuid boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
    RAISE EXCEPTION 'Invalid option';
  END IF;

  SELECT qa.finished_at, p.user_id, COALESCE(qa.lesson_id, qa.quiz_id)
  INTO v_finished, v_owner, v_lesson_id
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
  END IF;

  v_is_uuid := p_question_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

  -- Prioridade 1: tabela questions
  IF v_is_uuid THEN
    v_question_uuid := p_question_id::uuid;
    SELECT q.correct_option INTO v_correct
    FROM public.questions q
    WHERE q.id = v_question_uuid;
  END IF;

  -- Prioridade 2: JSON da lição
  IF v_correct IS NULL AND v_lesson_id IS NOT NULL THEN
    SELECT questions INTO v_questions_json FROM public.lessons WHERE id = v_lesson_id;

    IF v_questions_json IS NOT NULL THEN
      SELECT value INTO v_q_json
      FROM jsonb_array_elements(v_questions_json) AS value
      WHERE (value->>'id') = p_question_id;

      IF v_q_json IS NULL AND p_question_id LIKE 'q-%' THEN
        BEGIN
          v_q_json := v_questions_json->(substring(p_question_id from 3)::int);
        EXCEPTION WHEN OTHERS THEN
          v_q_json := NULL;
        END;
      END IF;

      IF v_q_json IS NOT NULL THEN
        v_correct := COALESCE(
          v_q_json->>'correct_option',
          v_q_json->>'respostaCorreta',
          v_q_json->>'correctOption',
          v_q_json->>'resposta_correta'
        );
      END IF;
    END IF;
  END IF;

  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'Question not found (ID: %)', p_question_id;
  END IF;

  v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

  IF v_is_uuid THEN
    INSERT INTO public.answers (attempt_id, question_id, question_ref, selected_option, is_correct)
    VALUES (p_attempt_id, v_question_uuid, NULL, UPPER(p_selected_option), v_is_correct)
    ON CONFLICT (attempt_id, COALESCE(question_id::text, question_ref))
    DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = EXCLUDED.is_correct;
  ELSE
    INSERT INTO public.answers (attempt_id, question_id, question_ref, selected_option, is_correct)
    VALUES (p_attempt_id, NULL, p_question_id, UPPER(p_selected_option), v_is_correct)
    ON CONFLICT (attempt_id, COALESCE(question_id::text, question_ref))
    DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = EXCLUDED.is_correct;
  END IF;

  RETURN QUERY SELECT v_is_correct, UPPER(v_correct);
END;
$$;

-- 4. Atualizar get_attempt_gabarito para suportar JSON da lição
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
    q.order_index,
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
    COALESCE((qj.value->>'order_index')::int, qj.ord) AS order_index,
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
    SELECT value, (ord - 1) AS ord
    FROM jsonb_array_elements(COALESCE(v_questions_json, '[]'::jsonb)) WITH ORDINALITY AS t(value, ord)
    WHERE (value->>'id') = a.question_ref
  ) qj
  WHERE a.attempt_id = p_attempt_id AND a.question_id IS NULL AND a.question_ref IS NOT NULL
  ORDER BY 2 ASC;
END;
$$;

-- 5. Migração retroativa: espelhar perguntas do JSON em public.questions
-- (somente para lições que ainda não têm registros em questions)
INSERT INTO public.questions (
  lesson_id, question_text, option_a, option_b, option_c, option_d,
  correct_option, order_index, active
)
SELECT
  l.id AS lesson_id,
  COALESCE(qj.value->>'pergunta', qj.value->>'question_text', 'Pergunta') AS question_text,
  COALESCE(qj.value->'alternativas'->>'a', qj.value->>'option_a', '') AS option_a,
  COALESCE(qj.value->'alternativas'->>'b', qj.value->>'option_b', '') AS option_b,
  COALESCE(qj.value->'alternativas'->>'c', qj.value->>'option_c', '') AS option_c,
  COALESCE(qj.value->'alternativas'->>'d', qj.value->>'option_d', '') AS option_d,
  UPPER(COALESCE(qj.value->>'respostaCorreta', qj.value->>'correct_option', qj.value->>'correctOption', 'A')) AS correct_option,
  (qj.ord - 1)::int AS order_index,
  true AS active
FROM public.lessons l
CROSS JOIN LATERAL jsonb_array_elements(l.questions) WITH ORDINALITY AS qj(value, ord)
WHERE jsonb_typeof(l.questions) = 'array'
  AND jsonb_array_length(l.questions) > 0
  AND NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.lesson_id = l.id);
