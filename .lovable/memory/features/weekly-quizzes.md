---
name: Weekly Quizzes
description: Sistema de quiz semanal com janela fixa, multiplicador de streak e ranking semanal/temporada acumulada.
type: feature
---

## Mecânica
- Quiz semanal definido pelo admin (`/painel-ebd-2025/quizzes`) com `week_number`, `opens_at`, `closes_at`, `season_id`.
- Quizzes sem `opens_at`/`closes_at` continuam funcionando como legado (sem bloqueio).
- Trigger `enforce_quiz_window` rejeita attempts fora da janela; copia `week_number` para a attempt.
- Trigger `update_streak_on_finish` calcula streak (consecutivo se `week_number = last + 1`, reseta para 1 se pulou) e aplica `streak_bonus = LEAST(streak, 5)`. Final score = score + streak_bonus.
- Tabela `participant_streaks (participant_name, season_id, current_streak, last_week_completed)` indexa por nome lowercased+trim.

## Frontend
- `src/hooks/useWeeklyQuiz.ts`: `useWeeklyQuiz`, `useNextScheduledQuiz`, `useParticipantStreak`.
- `src/pages/Index.tsx`: card "Quiz da Semana" com prazo + streak 🔥 + botão. Card "Próximo quiz" quando há quiz agendado.
- `src/pages/Quiz.tsx`: prefere quiz com janela aberta (turma do usuário); fallback para quiz legado por trimestre. Trata erro do trigger.
- `src/pages/Result.tsx`: mostra breakdown acertos + bônus + total quando há `week_number`.
- `src/pages/Ranking.tsx`: tabs **Semana / Temporada / Trimestral**. Default `weekly`. Usa views `ranking_weekly` e `ranking_season_accumulated`. Streak 🔥 mostrado no modo Temporada.

## Regras
- Cap do bônus: +5 pts (LEAST(streak, 5)).
- Quiz perdido (fora da janela): zera streak; não pode mais responder.
- Identificador de streak: nome lowercased+trim (mesmo critério do ranking atual).
