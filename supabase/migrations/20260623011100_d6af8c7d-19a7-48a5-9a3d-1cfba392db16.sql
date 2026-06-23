CREATE OR REPLACE FUNCTION public.get_trimestral_provao_questions(p_class_id uuid, p_season_id uuid)
 RETURNS TABLE(id text, question_text text, option_a text, option_b text, option_c text, option_d text, correct_option text, lesson_number integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_trimester INTEGER;
BEGIN
    SELECT trimester INTO v_trimester FROM lessons WHERE class_id = p_class_id AND trimester IS NOT NULL LIMIT 1;

    RETURN QUERY
    WITH lesson_questions AS (
        SELECT
            (q->>'id')::TEXT as q_id,
            (q->>'pergunta')::TEXT as q_text,
            (q->'alternativas'->>'a')::TEXT as opt_a,
            (q->'alternativas'->>'b')::TEXT as opt_b,
            (q->'alternativas'->>'c')::TEXT as opt_c,
            (q->'alternativas'->>'d')::TEXT as opt_d,
            (q->>'respostaCorreta')::TEXT as resp,
            l.lesson_number
        FROM lessons l,
        LATERAL jsonb_array_elements(l.questions) q
        WHERE l.class_id = p_class_id
          AND l.trimester = v_trimester
          AND l.lesson_number BETWEEN 1 AND 13
    ),
    ranked AS (
        SELECT
            q_id, q_text, opt_a, opt_b, opt_c, opt_d, resp, lesson_number,
            ROW_NUMBER() OVER (PARTITION BY lesson_number ORDER BY random()) AS rn
        FROM lesson_questions
    ),
    guaranteed_questions AS (
        SELECT q_id, q_text, opt_a, opt_b, opt_c, opt_d, resp, lesson_number
        FROM ranked
        WHERE rn <= 2
    )
    SELECT
      gq.q_id, gq.q_text, gq.opt_a, gq.opt_b, gq.opt_c, gq.opt_d, gq.resp, gq.lesson_number
    FROM guaranteed_questions gq
    ORDER BY random();
END;
$function$;