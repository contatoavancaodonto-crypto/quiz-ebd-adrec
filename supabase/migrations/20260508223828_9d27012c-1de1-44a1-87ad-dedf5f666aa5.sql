-- Function to get trimestral provão questions
CREATE OR REPLACE FUNCTION get_trimestral_provao_questions(p_class_id UUID, p_season_id UUID)
RETURNS TABLE (
    id TEXT,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT,
    lesson_number INTEGER
) AS $$
DECLARE
    v_trimester INTEGER;
BEGIN
    -- Get the trimester from the season (assuming name or looking at dates, but let's use the trimester of the lessons associated with the season)
    SELECT trimester INTO v_trimester FROM lessons WHERE class_id = p_class_id AND trimester IS NOT NULL LIMIT 1;

    RETURN QUERY
    WITH lesson_questions AS (
        -- Extract questions from JSONB column in lessons table
        -- We need to handle the structure: [{id, pergunta, alternativas: {a, b, c, d}, respostaCorreta}]
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
    guaranteed_questions AS (
        -- Pick 1 random question from EACH lesson (1-13)
        SELECT DISTINCT ON (lesson_number)
            q_id, q_text, opt_a, opt_b, opt_c, opt_d, resp, lesson_number
        FROM lesson_questions
        ORDER BY lesson_number, random()
    ),
    remaining_pool AS (
        -- All questions except the ones already picked
        SELECT * FROM lesson_questions
        WHERE q_id NOT IN (SELECT q_id FROM guaranteed_questions)
    ),
    extra_questions AS (
        -- Pick 7 more random questions to reach 20
        SELECT * FROM remaining_pool
        ORDER BY random()
        LIMIT 7
    ),
    final_selection AS (
        SELECT * FROM guaranteed_questions
        UNION ALL
        SELECT * FROM extra_questions
    )
    SELECT * FROM final_selection ORDER BY random();
END;
$$ LANGUAGE plpgsql;
