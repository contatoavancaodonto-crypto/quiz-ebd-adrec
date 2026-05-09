-- 1. Otimizar a view de ranking entre igrejas semanal
-- Agora considera apenas a melhor tentativa de cada participante por lição dentro da janela da semana
CREATE OR REPLACE VIEW public.ranking_churches_weekly AS
 WITH window_def AS (
         SELECT current_week_window.week_start,
            current_week_window.week_end
           FROM current_week_window() current_week_window(week_start, week_end)
        ), 
      best_attempts_per_week AS (
         SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id))
            pr.church_id,
            qa.participant_id,
            COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) AS final_score
           FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             JOIN participants part ON part.id = qa.participant_id
             LEFT JOIN profiles pr ON (pr.id = part.user_id OR (part.user_id IS NULL AND lower(trim(part.name)) = lower(trim(pr.first_name || ' ' || COALESCE(pr.last_name, '')))))
             CROSS JOIN window_def w
          WHERE qa.finished_at IS NOT NULL 
            AND pr.church_id IS NOT NULL 
            AND q.opens_at >= w.week_start 
            AND q.closes_at <= w.week_end
          ORDER BY qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id), COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) DESC, qa.total_time_ms ASC
        ),
      agg AS (
         SELECT church_id,
            avg(final_score)::numeric(10,2) AS avg_score,
            count(DISTINCT participant_id)::integer AS participants_count
           FROM best_attempts_per_week
          GROUP BY church_id
        )
 SELECT row_number() OVER (ORDER BY a.avg_score DESC, a.participants_count DESC) AS "position",
    a.church_id,
    ch.name AS church_name,
    ch.pastor_president,
    a.avg_score,
    a.participants_count
   FROM agg a
     JOIN churches ch ON ch.id = a.church_id
  WHERE ch.approved = true;

-- 2. Otimizar a RPC submit_answer para evitar exceções de cast de UUID
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

   -- Tenta converter para UUID de forma segura sem disparar exceção
   IF p_question_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
     v_question_uuid := p_question_id::uuid;
     SELECT q.correct_option INTO v_correct
     FROM public.questions q
     WHERE q.id = v_question_uuid;
   END IF;

   -- Se não achou na tabela (pode ser um ID legado q-0, etc), busca no JSON da lição
   IF v_correct IS NULL AND v_source_type = 'lesson_table' THEN
     SELECT questions INTO v_questions_json FROM public.lessons WHERE id = v_lesson_id;
     
     IF v_questions_json IS NOT NULL THEN
       SELECT value INTO v_q_json
       FROM jsonb_array_elements(v_questions_json) AS value
       WHERE (value->>'id') = p_question_id;

       IF v_q_json IS NULL AND p_question_id LIKE 'q-%' THEN
          -- Fallback por índice se for formato q-0, q-1...
          BEGIN
            v_q_json := v_questions_json->(substring(p_question_id from 3)::int);
          EXCEPTION WHEN OTHERS THEN
            v_q_json := NULL;
          END;
       END IF;

       IF v_q_json IS NOT NULL THEN
         v_correct := COALESCE(v_q_json->>'correct_option', v_q_json->>'respostaCorreta', v_q_json->>'correctOption');
       END IF;
     END IF;
   END IF;

   IF v_correct IS NULL THEN
     RAISE EXCEPTION 'Question not found';
   END IF;

   v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

   INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
   VALUES (p_attempt_id, p_question_id, UPPER(p_selected_option), v_is_correct)
   ON CONFLICT (attempt_id, question_id) 
   DO UPDATE SET 
     selected_option = EXCLUDED.selected_option,
     is_correct = EXCLUDED.is_correct;

   RETURN QUERY SELECT v_is_correct, v_correct;
 END;
 $function$;
