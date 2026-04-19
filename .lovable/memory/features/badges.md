---
name: Badges System
description: Badges automáticos atribuídos via trigger ao finalizar quiz e ao encerrar temporada (perfeitos, velocidade, top igreja/geral, campeão da temporada)
type: feature
---

## Tabelas
- `badges` (definições): code, name, description, emoji, type. Públicas para leitura. Tipos permitidos: `church`, `general`, `perfect_score`, `max_speed`, `permanent`, `season_permanent`.
- `user_badges`: participant_id, badge_id, attempt_id, season_id, earned_at. Únicos por (participant, badge, season).
- `quiz_attempts.season_id` preenchido automaticamente via trigger BEFORE INSERT.

## Badges (códigos)
### Durante a temporada (atribuídos ao finalizar o quiz)
- `perfect_score` 🎯 — score == total_questions. **Permanente** na attempt.
- `max_speed` ⚡ — melhor tempo entre os perfect_score da temporada. **Transferível**.
- `top_church` 🥇 — melhor score+tempo da igreja na temporada. **Transferível**.
- `top_general` 🏆 — melhor score+tempo geral na temporada. **Transferível**.

### Ao encerrar a temporada (Fase 4 — permanentes)
- `season_champion` 🏆 — 1º lugar geral ao encerramento. Permanente.
- `season_top3` 🥈 — 2º e 3º lugar geral. Permanente.
- `season_church_champion` ⛪ — 1º de cada igreja. Permanente.

## Triggers
- `award_badges_on_finish` AFTER UPDATE ON quiz_attempts (durante a temporada).
- `on_season_closed` AFTER UPDATE ON seasons → chama `award_season_end_badges(season_id)` quando status passa para `closed`.

## Como encerrar uma temporada (admin)
```sql
UPDATE public.seasons SET status = 'closed' WHERE id = '<season_id>';
```
A premiação permanente é atribuída automaticamente pelo trigger.

## UI
- `useBadgesForAttempt(attemptId, participantId)` — combina badges fixos da attempt + badges transferíveis/permanentes atualmente em posse.
- `<BadgesShowcase />` — exibido na tela de Result.
- Realtime leaderboard (Fase 3) atualiza ranking ao finalizar quizzes.
