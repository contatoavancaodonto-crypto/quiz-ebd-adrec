-- Update the enforcement function to strictly check the 'active' column
CREATE OR REPLACE FUNCTION public.enforce_quiz_window()
RETURNS TRIGGER AS $$
DECLARE
    v_active BOOLEAN;
    v_opens_at TIMESTAMPTZ;
    v_closes_at TIMESTAMPTZ;
    v_quiz_kind TEXT;
BEGIN
    SELECT active, opens_at, closes_at, quiz_kind
    INTO v_active, v_opens_at, v_closes_at, v_quiz_kind
    FROM public.quizzes
    WHERE id = NEW.quiz_id;

    -- If the quiz itself is marked as inactive, deny access regardless of anything else
    IF v_active IS FALSE THEN
        RAISE EXCEPTION 'Este quiz está desativado pelo administrador.';
    END IF;

    -- For weekly quizzes, check dates
    IF v_quiz_kind = 'weekly' AND v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL THEN
        IF NOW() < v_opens_at THEN
            RAISE EXCEPTION 'Este quiz ainda não está aberto (abre em %).', 
                to_char(v_opens_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:mi');
        END IF;
        IF NOW() > v_closes_at THEN
            RAISE EXCEPTION 'Este quiz já está encerrado (encerrou em %).',
                to_char(v_closes_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:mi');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Refine the streak bonus calculation (Extra Point for deadline)
CREATE OR REPLACE FUNCTION public.calculate_quiz_streak_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_quiz_kind TEXT;
    v_opens_at TIMESTAMPTZ;
    v_closes_at TIMESTAMPTZ;
BEGIN
    -- Only run when finished_at is being set (quiz completed)
    IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
        -- Get quiz metadata
        SELECT quiz_kind, opens_at, closes_at
        INTO v_quiz_kind, v_opens_at, v_closes_at
        FROM public.quizzes
        WHERE id = NEW.quiz_id;

        -- Logic for Weekly Quiz: +1 point bonus if on time
        IF v_quiz_kind = 'weekly' THEN
            -- Check if completed within window
            IF v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL AND 
               NEW.finished_at >= v_opens_at AND NEW.finished_at <= v_closes_at THEN
                -- Set +1 point for "aula dentro do prazo"
                NEW.streak_bonus := 1;
            ELSE
                -- Outside window, no bonus for "on time"
                NEW.streak_bonus := 0;
            END IF;
        ELSE
            -- Non-weekly quizzes (e.g. Trimestral) don't get this bonus
            NEW.streak_bonus := 0;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update Views to ensure they use final_score for ranking
CREATE OR REPLACE VIEW public.ranking_by_class AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    qa.final_score,
    qa.total_questions,
    qa.total_time_seconds,
    qa.total_time_ms,
    qa.accuracy_percentage,
    qa.finished_at,
    p.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    ch.id AS church_id,
    ch.name AS church_name,
    q.trimester,
    false AS is_retry,
    row_number() OVER (PARTITION BY c.id, q.trimester ORDER BY qa.final_score DESC, COALESCE(NULLIF(qa.total_time_ms, 0), ((qa.total_time_seconds * 1000))::bigint), qa.finished_at) AS "position"
   FROM (((((quiz_attempts qa
     JOIN participants p ON ((p.id = qa.participant_id)))
     JOIN classes c ON ((c.id = p.class_id)))
     JOIN quizzes q ON ((q.id = qa.quiz_id)))
     LEFT JOIN profiles pr ON (((pr.id)::text = (p.id)::text)))
     LEFT JOIN churches ch ON ((ch.id = pr.church_id)))
  WHERE ((qa.finished_at IS NOT NULL) AND (qa.score >= 5) AND (upper(p.name) <> 'TESTE123'::text));

CREATE OR REPLACE VIEW public.ranking_general AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    qa.final_score,
    qa.total_questions,
    qa.total_time_seconds,
    qa.total_time_ms,
    qa.accuracy_percentage,
    qa.finished_at,
    p.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    ch.id AS church_id,
    ch.name AS church_name,
    q.trimester,
    false AS is_retry,
    row_number() OVER (PARTITION BY q.trimester ORDER BY qa.final_score DESC, COALESCE(NULLIF(qa.total_time_ms, 0), ((qa.total_time_seconds * 1000))::bigint), qa.finished_at) AS "position"
   FROM (((((quiz_attempts qa
     JOIN participants p ON ((p.id = qa.participant_id)))
     JOIN classes c ON ((c.id = p.class_id)))
     JOIN quizzes q ON ((q.id = qa.quiz_id)))
     LEFT JOIN profiles pr ON (((pr.id)::text = (p.id)::text)))
     LEFT JOIN churches ch ON ((ch.id = pr.church_id)))
  WHERE ((qa.finished_at IS NOT NULL) AND (qa.score >= 5) AND (upper(p.name) <> 'TESTE123'::text));

CREATE OR REPLACE VIEW public.ranking_weekly AS
 SELECT qa.id AS attempt_id,
    row_number() OVER (PARTITION BY q.id ORDER BY qa.final_score DESC, qa.total_time_ms, qa.finished_at) AS "position",
    part.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    pr.church_id,
    ch.name AS church_name,
    q.id AS quiz_id,
    q.week_number,
    qa.score,
    qa.streak_bonus,
    qa.final_score,
    qa.total_questions,
    qa.total_time_seconds,
    qa.total_time_ms,
    qa.accuracy_percentage,
    qa.season_id
   FROM (((((quiz_attempts qa
     JOIN quizzes q ON ((q.id = qa.quiz_id)))
     JOIN participants part ON ((part.id = qa.participant_id)))
     JOIN classes c ON ((c.id = q.class_id)))
     LEFT JOIN profiles pr ON ((lower(TRIM(BOTH FROM ((pr.first_name || ' '::text) || COALESCE(pr.last_name, ''::text)))) = lower(TRIM(BOTH FROM part.name)))))
     LEFT JOIN churches ch ON ((ch.id = pr.church_id)))
  WHERE ((qa.finished_at IS NOT NULL) AND (q.opens_at IS NOT NULL) AND (q.closes_at IS NOT NULL));
