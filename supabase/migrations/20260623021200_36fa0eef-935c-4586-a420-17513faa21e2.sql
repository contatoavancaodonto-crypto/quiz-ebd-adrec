CREATE OR REPLACE FUNCTION public.get_trimestral_provao_questions(p_class_id uuid, p_season_id uuid)
 RETURNS TABLE(id text, question_text text, option_a text, option_b text, option_c text, option_d text, correct_option text, lesson_number integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_trimester TEXT;
BEGIN
    SELECT l.trimester::text INTO v_trimester
    FROM lessons l
    WHERE l.class_id = p_class_id AND l.trimester IS NOT NULL
    LIMIT 1;

    RETURN QUERY
    WITH lesson_questions AS (
        SELECT
            (q->>'id')::TEXT as q_id,
            (q->>'pergunta')::TEXT as q_text,
            (q->'alternativas'->>'a')::TEXT as opt_a,
            (q->'alternativas'->>'b')::TEXT as opt_b,
            (q->'alternativas'->>'c')::TEXT as opt_c,
            (q->'alternativas'->>'d')::TEXT as opt_d,
            UPPER((q->>'respostaCorreta')::TEXT) as resp,
            l.lesson_number AS l_num
        FROM lessons l,
        LATERAL jsonb_array_elements(l.questions) q
        WHERE l.class_id = p_class_id
          AND l.trimester::text = v_trimester
          AND l.lesson_number BETWEEN 1 AND 13
    )
    SELECT lq.q_id, lq.q_text, lq.opt_a, lq.opt_b, lq.opt_c, lq.opt_d, lq.resp, lq.l_num
    FROM lesson_questions lq
    ORDER BY random()
    LIMIT 20;
END;
$function$;