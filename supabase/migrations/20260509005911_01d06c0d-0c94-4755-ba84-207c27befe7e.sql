-- View para auditoria de múltiplas tentativas no mês atual
CREATE OR REPLACE VIEW public.view_audit_duplicate_attempts AS
WITH current_month_attempts AS (
    SELECT 
        qa.participant_id,
        p.name as participant_name,
        COALESCE(qa.lesson_id, qa.quiz_id) as lesson_key,
        COALESCE(l.theme, 'Quiz Avulso') as lesson_theme,
        ch.name as church_name,
        c.name as class_name,
        count(*) as attempts_count,
        max(COALESCE(qa.final_score, qa.score + COALESCE(qa.streak_bonus, 0))) as best_score,
        min(COALESCE(qa.final_score, qa.score + COALESCE(qa.streak_bonus, 0))) as worst_score,
        sum(COALESCE(qa.final_score, qa.score + COALESCE(qa.streak_bonus, 0))) as total_inflated_sum
    FROM quiz_attempts qa
    JOIN participants p ON p.id = qa.participant_id
    LEFT JOIN lessons l ON l.id = qa.lesson_id
    LEFT JOIN classes c ON c.id = p.class_id
    LEFT JOIN profiles prof ON prof.id = p.user_id
    LEFT JOIN churches ch ON ch.id = prof.church_id
    WHERE qa.finished_at IS NOT NULL
      AND (date_trunc('month', (qa.finished_at AT TIME ZONE 'America/Sao_Paulo')) = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')))
    GROUP BY qa.participant_id, p.name, COALESCE(qa.lesson_id, qa.quiz_id), l.theme, ch.name, c.name
    HAVING count(*) > 1
)
SELECT 
    *,
    (total_inflated_sum - best_score) as points_saved_by_fix
FROM current_month_attempts
ORDER BY attempts_count DESC;

COMMENT ON VIEW public.view_audit_duplicate_attempts IS 'Relatório de participantes com múltiplas tentativas finalizadas na mesma lição no mês atual.';
