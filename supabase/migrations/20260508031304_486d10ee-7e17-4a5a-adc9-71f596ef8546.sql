-- Atualizar a função submit_answer para ser mais robusta com os novos formatos
CREATE OR REPLACE FUNCTION public.submit_answer(p_attempt_id uuid, p_question_id text, p_selected_option text)
 RETURNS TABLE(is_correct boolean, correct_option text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_correct text;
  v_is_correct boolean;
  v_finished timestamptz;
  v_owner uuid;
  v_source_type text;
  v_lesson_id uuid;
  v_questions jsonb;
  v_q jsonb;
BEGIN
  -- Segurança: verifica se o usuário está logado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Normaliza a opção selecionada
  IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
    RAISE EXCEPTION 'Invalid option';
  END IF;

  -- Obtém metadados da tentativa
  SELECT qa.finished_at, p.user_id, qa.source_type, qa.quiz_id 
  INTO v_finished, v_owner, v_source_type, v_lesson_id
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  -- Verifica propriedade da tentativa
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Verifica se o quiz já foi finalizado
  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
  END IF;

  -- Lógica de correção baseada na origem (tabela de lições ou tabela de quizzes)
  IF v_source_type = 'lesson_table' THEN
    -- Puxa as questões da tabela lessons
    SELECT questions INTO v_questions FROM public.lessons WHERE id = v_lesson_id;
    
    -- Busca a questão correta no JSON
    SELECT value INTO v_q 
    FROM jsonb_array_elements(v_questions) AS value 
    WHERE (value->>'id') = p_question_id;

    IF v_q IS NULL THEN
       -- Fallback: tenta buscar por índice se o ID for q-index
       IF p_question_id LIKE 'q-%' THEN
         v_q := v_questions->(substring(p_question_id from 3)::int);
       END IF;
    END IF;

    IF v_q IS NULL THEN
      RAISE EXCEPTION 'Question not found in lesson';
    END IF;

    -- Suporta 'correct_option' (padrão) ou 'respostaCorreta' (formato Drive)
    v_correct := COALESCE(v_q->>'correct_option', v_q->>'respostaCorreta');
  ELSE
    -- Puxa da tabela questions tradicional (p_question_id deve ser UUID neste caso)
    SELECT q.correct_option INTO v_correct
    FROM public.questions q
    WHERE q.id = p_question_id::uuid;
  END IF;

  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'Correct option not found';
  END IF;

  v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

  -- Registra a resposta (usa coalesce para tratar p_question_id que pode ser string não-uuid)
  INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
  VALUES (
    p_attempt_id, 
    CASE WHEN v_source_type = 'lesson_table' OR p_question_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN '00000000-0000-0000-0000-000000000000' 
         ELSE p_question_id::uuid 
    END, 
    UPPER(p_selected_option), 
    v_is_correct
  );

  RETURN QUERY SELECT v_is_correct, v_correct;
END;
$function$;