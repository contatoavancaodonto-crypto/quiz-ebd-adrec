-- 1. Índice único: 1 Provão finalizado por participante/trimestre
CREATE UNIQUE INDEX IF NOT EXISTS uniq_provao_per_participant_trimester
  ON public.quiz_attempts (participant_id, trimester)
  WHERE source_type = 'trimestral_rpc' AND finished_at IS NOT NULL;

-- 2. View de auditoria de consistência
CREATE OR REPLACE VIEW public.provao_consistency_check AS
WITH attempts AS (
  SELECT
    qa.participant_id,
    p.name AS participant_name,
    p.class_id,
    c.name AS class_name,
    qa.trimester,
    COUNT(*) AS attempts_count,
    LEAST(MAX(qa.score), 26) AS best_score_capped
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  LEFT JOIN public.classes c ON c.id = p.class_id
  WHERE qa.source_type = 'trimestral_rpc'
    AND qa.finished_at IS NOT NULL
    AND UPPER(p.name) <> 'TESTE123'
  GROUP BY qa.participant_id, p.name, p.class_id, c.name, qa.trimester
),
ranking AS (
  SELECT participant_name, class_id, trimester, exam_score
  FROM public.ranking_trimester_consolidated
)
SELECT
  a.participant_id,
  a.participant_name,
  a.class_id,
  a.class_name,
  a.trimester,
  a.attempts_count,
  a.best_score_capped AS attempt_score,
  COALESCE(r.exam_score, 0) AS ranking_exam_score,
  CASE
    WHEN a.attempts_count > 1 THEN 'DUPLICATE_ATTEMPT'
    WHEN COALESCE(r.exam_score, 0) <> a.best_score_capped THEN 'SCORE_MISMATCH'
    ELSE 'OK'
  END AS status
FROM attempts a
LEFT JOIN ranking r
  ON r.participant_name = a.participant_name
 AND r.class_id = a.class_id
 AND r.trimester = a.trimester
WHERE a.attempts_count > 1
   OR COALESCE(r.exam_score, 0) <> a.best_score_capped;

GRANT SELECT ON public.provao_consistency_check TO authenticated, service_role;