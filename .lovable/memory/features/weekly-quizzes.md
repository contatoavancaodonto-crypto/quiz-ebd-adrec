---
name: Weekly Quizzes
description: Sistema de quiz semanal com janela fixa, multiplicador de streak, ranking semanal/temporada acumulada e cron automático seg→dom.
type: feature
---

## Mecânica
- Quiz semanal definido pelo admin (`/painel-ebd-2025/quizzes`) com `week_number`, `opens_at`, `closes_at`, `season_id`.
- Quizzes sem `opens_at`/`closes_at` continuam funcionando como legado (sem bloqueio) e funcionam como **fila de quizzes futuros** consumida pelo cron.
- Trigger `enforce_quiz_window` rejeita attempts fora da janela; copia `week_number` para a attempt.
- Trigger `update_streak_on_finish` calcula streak (consecutivo se `week_number = last + 1`, reseta para 1 se pulou) e aplica `streak_bonus = LEAST(streak, 5)`. Final score = score + streak_bonus.
- Tabela `participant_streaks (participant_name, season_id, current_streak, last_week_completed)` indexa por nome lowercased+trim.

## Cron automático (semanal)
- Função `public.tick_weekly_quiz_schedule()` roda a cada 5 min via `pg_cron` (job `weekly-quiz-tick`).
- Para cada turma ativa: se não há quiz aberto na janela atual (seg 00:00 → dom 23:59:59 America/Sao_Paulo), promove o **próximo quiz da fila** (`opens_at IS NULL AND closes_at IS NULL`, ordenado por `created_at`) preenchendo `opens_at`/`closes_at` da semana corrente e `week_number` (último + 1).
- Janela calculada por `public.current_week_window()` (date_trunc('week') em SP).
- Admin só precisa cadastrar os quizzes em ordem; o sistema agenda sozinho toda segunda.

## Frontend
- `src/hooks/useWeeklyQuiz.ts`: `useWeeklyQuiz`, `useNextScheduledQuiz`, `useParticipantStreak`.
- `src/pages/Index.tsx`: **hero do Quiz da Semana** com countdown até dom 23:59, streak 🔥, badge "já respondeu". Versículo do dia logo abaixo. Trimestre/turma colapsado em `<details>` "Arquivo trimestral".
- `src/pages/Quiz.tsx`: prefere quiz com janela aberta (turma do usuário); fallback para quiz legado por trimestre. Trata erro do trigger.
- `src/pages/Result.tsx`: mostra breakdown acertos + bônus + total; exibe streak atual e última semana concluída.
- `src/pages/Ranking.tsx`: tabs **Semana / Temporada / Trimestral**. Default `weekly`. Usa views `ranking_weekly` e `ranking_season_accumulated`. Streak 🔥 mostrado no modo Temporada.

## Regras
- Cap do bônus: +5 pts (LEAST(streak, 5)).
- Quiz perdido (fora da janela): zera streak; não pode mais responder.
- Identificador de streak: nome lowercased+trim (mesmo critério do ranking atual).
