CREATE OR REPLACE FUNCTION public.submit_answer(p_attempt_id uuid, p_question_id text, p_selected_option text)
 RETURNS TABLE(is_correct boolean, correct_option text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_source_type text;
  v_trimester int;
  v_class_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
    RAISE EXCEPTION 'Invalid option';
  END IF;

  SELECT qa.finished_at, p.user_id, COALESCE(qa.lesson_id, qa.quiz_id),
         qa.source_type, qa.trimester, p.class_id
  INTO v_finished, v_owner, v_lesson_id, v_source_type, v_trimester, v_class_id
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

  -- Prioridade 2: JSON da lição ligada à tentativa
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

  -- Prioridade 3: Provão Trimestral — busca em todas as lições do trimestre/turma
  IF v_correct IS NULL AND v_source_type = 'trimestral_rpc' AND v_class_id IS NOT NULL AND v_trimester IS NOT NULL THEN
    SELECT COALESCE(
        q->>'correct_option',
        q->>'respostaCorreta',
        q->>'correctOption',
        q->>'resposta_correta'
    )
    INTO v_correct
    FROM public.lessons l,
         LATERAL jsonb_array_elements(l.questions) q
    WHERE l.class_id = v_class_id
      AND l.trimester::text = v_trimester::text
      AND (q->>'id') = p_question_id
    LIMIT 1;
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
$function$;