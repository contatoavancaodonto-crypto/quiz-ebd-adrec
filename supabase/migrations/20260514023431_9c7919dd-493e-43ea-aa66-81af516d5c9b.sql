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
   v_questions_json jsonb;
   v_q_json jsonb;
   v_question_uuid uuid;
 BEGIN
   IF auth.uid() IS NULL THEN
     RAISE EXCEPTION 'Unauthorized';
   END IF;

   IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
     RAISE EXCEPTION 'Invalid option';
   END IF;

   -- Busca dados da tentativa
   SELECT qa.finished_at, p.user_id, qa.source_type, COALESCE(qa.lesson_id, qa.quiz_id)
   INTO v_finished, v_owner, v_source_type, v_lesson_id
   FROM public.quiz_attempts qa
   JOIN public.participants p ON p.id = qa.participant_id
   WHERE qa.id = p_attempt_id;

   IF v_owner IS NULL OR v_owner <> auth.uid() THEN
     RAISE EXCEPTION 'Forbidden';
   END IF;

   IF v_finished IS NOT NULL THEN
     RAISE EXCEPTION 'Attempt already finalized';
   END IF;

   -- Prioridade 1: Tabela public.questions
   IF p_question_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
     v_question_uuid := p_question_id::uuid;
     SELECT q.correct_option INTO v_correct
     FROM public.questions q
     WHERE q.id = v_question_uuid;
   END IF;

   -- Prioridade 2: JSON da lição (fallback para lições sem sincronização completa)
   IF v_correct IS NULL AND v_lesson_id IS NOT NULL THEN
     SELECT questions INTO v_questions_json FROM public.lessons WHERE id = v_lesson_id;
     
     IF v_questions_json IS NOT NULL THEN
       -- Busca pelo campo id no JSON
       SELECT value INTO v_q_json
       FROM jsonb_array_elements(v_questions_json) AS value
       WHERE (value->>'id') = p_question_id;

       -- Fallback: busca por índice se o ID for q-0, q-1...
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

   -- Salva a resposta (conversão segura para question_id uuid se possível)
   IF p_question_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      v_question_uuid := p_question_id::uuid;
   ELSE
      v_question_uuid := NULL;
   END IF;

   INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
   VALUES (p_attempt_id, v_question_uuid, UPPER(p_selected_option), v_is_correct)
   ON CONFLICT (attempt_id, question_id) 
   DO UPDATE SET 
     selected_option = EXCLUDED.selected_option,
     is_correct = EXCLUDED.is_correct;

   RETURN QUERY SELECT v_is_correct, UPPER(v_correct);
 END;
 $function$;