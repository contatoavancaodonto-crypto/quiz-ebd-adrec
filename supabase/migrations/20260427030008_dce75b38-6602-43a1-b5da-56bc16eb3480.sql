-- Restore original structure of interchurch ranking views, now including pastor_president

DROP VIEW IF EXISTS public.ranking_churches_weekly CASCADE;
CREATE VIEW public.ranking_churches_weekly
WITH (security_invoker = on) AS
WITH window_def AS (
  SELECT week_start, week_end FROM public.current_week_window()
),
per_participant AS (
  SELECT
    pr.church_id,
    lower(trim(part.name)) AS name_key,
    avg(COALESCE(qa.final_score, qa.score + qa.streak_bonus))::numeric AS participant_avg
  FROM quiz_attempts qa
  JOIN participants part ON part.id = qa.participant_id
  JOIN quizzes q ON q.id = qa.quiz_id
  LEFT JOIN profiles pr
    ON lower(trim((pr.first_name || ' ') || COALESCE(pr.last_name, ''))) = lower(trim(part.name))
  CROSS JOIN window_def w
  WHERE qa.finished_at IS NOT NULL
    AND pr.church_id IS NOT NULL
    AND q.opens_at IS NOT NULL AND q.closes_at IS NOT NULL
    AND q.opens_at >= w.week_start AND q.closes_at <= w.week_end
  GROUP BY pr.church_id, lower(trim(part.name))
),
agg AS (
  SELECT
    pp.church_id,
    avg(pp.participant_avg)::numeric(10,2) AS avg_score,
    count(*)::int AS participants_count
  FROM per_participant pp
  GROUP BY pp.church_id
)
SELECT
  row_number() OVER (ORDER BY a.avg_score DESC, a.participants_count DESC) AS position,
  a.church_id,
  ch.name AS church_name,
  ch.pastor_president,
  a.avg_score,
  a.participants_count
FROM agg a
JOIN churches ch ON ch.id = a.church_id
WHERE ch.approved = true;

DROP VIEW IF EXISTS public.ranking_churches_monthly CASCADE;
CREATE VIEW public.ranking_churches_monthly
WITH (security_invoker = on) AS
WITH per_participant AS (
  SELECT
    pr.church_id,
    lower(trim(part.name)) AS name_key,
    avg(COALESCE(qa.final_score, qa.score + qa.streak_bonus))::numeric AS participant_avg
  FROM quiz_attempts qa
  JOIN participants part ON part.id = qa.participant_id
  LEFT JOIN profiles pr
    ON lower(trim((pr.first_name || ' ') || COALESCE(pr.last_name, ''))) = lower(trim(part.name))
  WHERE qa.finished_at IS NOT NULL
    AND pr.church_id IS NOT NULL
    AND date_trunc('month', (qa.finished_at AT TIME ZONE 'America/Sao_Paulo'))
        = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))
  GROUP BY pr.church_id, lower(trim(part.name))
),
agg AS (
  SELECT
    pp.church_id,
    avg(pp.participant_avg)::numeric(10,2) AS avg_score,
    count(*)::int AS participants_count
  FROM per_participant pp
  GROUP BY pp.church_id
)
SELECT
  row_number() OVER (ORDER BY a.avg_score DESC, a.participants_count DESC) AS position,
  a.church_id,
  ch.name AS church_name,
  ch.pastor_president,
  a.avg_score,
  a.participants_count
FROM agg a
JOIN churches ch ON ch.id = a.church_id
WHERE ch.approved = true;

DROP VIEW IF EXISTS public.ranking_churches_classic CASCADE;
CREATE VIEW public.ranking_churches_classic
WITH (security_invoker = on) AS
WITH per_participant AS (
  SELECT
    q.trimester,
    pr.church_id,
    lower(trim(part.name)) AS name_key,
    avg(COALESCE(qa.final_score, qa.score + qa.streak_bonus))::numeric AS participant_avg
  FROM quiz_attempts qa
  JOIN participants part ON part.id = qa.participant_id
  JOIN quizzes q ON q.id = qa.quiz_id
  LEFT JOIN profiles pr
    ON lower(trim((pr.first_name || ' ') || COALESCE(pr.last_name, ''))) = lower(trim(part.name))
  WHERE qa.finished_at IS NOT NULL
    AND pr.church_id IS NOT NULL
  GROUP BY q.trimester, pr.church_id, lower(trim(part.name))
),
agg AS (
  SELECT
    pp.trimester,
    pp.church_id,
    avg(pp.participant_avg)::numeric(10,2) AS avg_score,
    count(*)::int AS participants_count
  FROM per_participant pp
  GROUP BY pp.trimester, pp.church_id
)
SELECT
  row_number() OVER (PARTITION BY a.trimester ORDER BY a.avg_score DESC, a.participants_count DESC) AS position,
  a.trimester,
  a.church_id,
  ch.name AS church_name,
  ch.pastor_president,
  a.avg_score,
  a.participants_count
FROM agg a
JOIN churches ch ON ch.id = a.church_id
WHERE ch.approved = true;