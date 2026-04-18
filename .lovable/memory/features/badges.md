---
name: Badges System
description: Badges automáticos atribuídos via trigger ao finalizar quiz (perfect_score, max_speed, top_church, top_general)
type: feature
---

## Tabelas
- `badges` (definições): code, name, description, emoji, type. Públicas para leitura.
- `user_badges`: participant_id, badge_id, attempt_id, season_id, earned_at. Único por (participant, badge, season). Públicas para leitura.
- `quiz_attempts.season_id` adicionado, preenchido automaticamente via trigger BEFORE INSERT.

## 4 Badges (códigos)
- `perfect_score` 🎯 — score == total_questions. **Permanente** (fica na attempt para sempre).
- `max_speed` ⚡ — melhor tempo entre todos os perfect_score da temporada. **Transferível**: ao finalizar, se nova tentativa supera, badge migra.
- `top_church` 🥇 — melhor score+tempo da igreja na temporada. **Transferível**.
- `top_general` 🏆 — melhor score+tempo geral na temporada. **Transferível**.

## Trigger
- `award_badges_on_finish` AFTER UPDATE ON quiz_attempts.
- Dispara apenas quando `finished_at` passa de NULL → NOT NULL.
- Igreja do participante é descoberta via match `LOWER(TRIM(profile.first_name + last_name)) = participant.name`.
- Tie-breaker: score DESC, total_time_ms ASC.

## UI
- `useBadgesForAttempt(attemptId, participantId)` — combina badges fixos da attempt + badges transferíveis atualmente em posse.
- `<BadgesShowcase />` — exibido na tela de Result após o stats grid, antes do ranking da igreja.

## Próximas fases (não implementadas)
- Leaderboard realtime, premiação automática ao encerrar temporada, badges permanentes por temporada ("Campeão da Temporada").
