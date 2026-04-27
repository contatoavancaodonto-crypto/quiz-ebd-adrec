-- Add pastor_president column to churches
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS pastor_president TEXT;

-- Recreate interchurch ranking views to include pastor_president
DROP VIEW IF EXISTS public.ranking_churches_weekly;
DROP VIEW IF EXISTS public.ranking_churches_monthly;
DROP VIEW IF EXISTS public.ranking_churches_classic;

CREATE OR REPLACE VIEW public.ranking_churches_weekly AS
WITH window_bounds AS (
  SELECT week_start, week_end FROM public.current_week_window()
),
participant_avg AS (
  SELECT
    pr.church_id,
    qa.participant_id,
    AVG(COALESCE(qa.final_score, qa.score + qa.streak_bonus))::numeric AS p_avg
  FROM public.quiz_attempts qa
  JOIN public.participants part ON part.id = qa.participant_id
  LEFT JOIN public.profiles pr
    ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
  CROSS JOIN window_bounds wb
  WHERE qa.finished_at IS NOT NULL
    AND qa.finished_at >= wb.week_start
    AND qa.finished_at <= wb.week_end
    AND pr.church_id IS NOT NULL
  GROUP BY pr.church_id, qa.participant_id
)
SELECT
  c.id AS church_id,
  c.name AS church_name,
  c.pastor_president,
  COUNT(pa.participant_id)::int AS participants_count,
  AVG(pa.p_avg)::numeric(10,2) AS avg_score
FROM public.churches c
JOIN participant_avg pa ON pa.church_id = c.id
GROUP BY c.id, c.name, c.pastor_president
ORDER BY avg_score DESC NULLS LAST;

CREATE OR REPLACE VIEW public.ranking_churches_monthly AS
WITH participant_avg AS (
  SELECT
    pr.church_id,
    qa.participant_id,
    AVG(COALESCE(qa.final_score, qa.score + qa.streak_bonus))::numeric AS p_avg
  FROM public.quiz_attempts qa
  JOIN public.participants part ON part.id = qa.participant_id
  LEFT JOIN public.profiles pr
    ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
  WHERE qa.finished_at IS NOT NULL
    AND date_trunc('month', qa.finished_at AT TIME ZONE 'America/Sao_Paulo')
        = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))
    AND pr.church_id IS NOT NULL
  GROUP BY pr.church_id, qa.participant_id
)
SELECT
  c.id AS church_id,
  c.name AS church_name,
  c.pastor_president,
  COUNT(pa.participant_id)::int AS participants_count,
  AVG(pa.p_avg)::numeric(10,2) AS avg_score
FROM public.churches c
JOIN participant_avg pa ON pa.church_id = c.id
GROUP BY c.id, c.name, c.pastor_president
ORDER BY avg_score DESC NULLS LAST;

CREATE OR REPLACE VIEW public.ranking_churches_classic AS
WITH participant_avg AS (
  SELECT
    pr.church_id,
    qa.season_id,
    qa.participant_id,
    AVG(COALESCE(qa.final_score, qa.score + qa.streak_bonus))::numeric AS p_avg
  FROM public.quiz_attempts qa
  JOIN public.participants part ON part.id = qa.participant_id
  LEFT JOIN public.profiles pr
    ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
  WHERE qa.finished_at IS NOT NULL
    AND pr.church_id IS NOT NULL
  GROUP BY pr.church_id, qa.season_id, qa.participant_id
)
SELECT
  c.id AS church_id,
  c.name AS church_name,
  c.pastor_president,
  pa.season_id,
  COUNT(pa.participant_id)::int AS participants_count,
  AVG(pa.p_avg)::numeric(10,2) AS avg_score
FROM public.churches c
JOIN participant_avg pa ON pa.church_id = c.id
GROUP BY c.id, c.name, c.pastor_president, pa.season_id
ORDER BY avg_score DESC NULLS LAST;