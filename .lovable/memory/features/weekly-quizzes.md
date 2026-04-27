---
name: Weekly Quizzes
description: Quiz semanal (5 perguntas, lição da revista, seg→dom) é a rotina principal. Provão trimestral (13 perguntas) só aparece em destaque na última semana do trimestre. Cron, streak, ranking, vínculo com lição.
type: feature
---

## Conceito principal
- **Quiz Semanal** (`quiz_kind = 'weekly'`): 5 perguntas, abre seg 00:00 → fecha dom 23:59 BRT. É a rotina padrão exibida na home.
- **Provão Trimestral** (`quiz_kind = 'trimestral'`): 13 perguntas, evento de fim de trimestre. Não entra na fila do agendador automático. Aparece como card amarelo na home apenas quando faltam ≤ 14 dias para `season.end_date`.
- Cada quiz semanal está vinculado a **uma lição da revista**: `lesson_number` (1..13), `lesson_title`, `lesson_key_verse_ref`, `lesson_key_verse_text`.

## Cron automático (semanal)
- Função `public.tick_weekly_quiz_schedule()` roda a cada 5 min via `pg_cron` (job `weekly-quiz-tick`).
- **Filtra `quiz_kind = 'weekly'`**: só promove quizzes weekly da fila. Trimestrais ficam fora.
- Para cada turma ativa, se não há quiz aberto na janela atual, promove o próximo quiz weekly da fila (`opens_at IS NULL AND closes_at IS NULL`, ordenado por `lesson_number ASC, created_at ASC`) preenchendo `opens_at`/`closes_at` da semana corrente e `week_number` (último + 1).
- Janela calculada por `public.current_week_window()` (date_trunc('week') em SP).
- Admin só precisa cadastrar quizzes em ordem (com `lesson_number`); o sistema agenda sozinho toda segunda.

## Mecânica de streak
- Trigger `enforce_quiz_window` rejeita attempts fora da janela; copia `week_number` para a attempt.
- Trigger `update_streak_on_finish` calcula streak (consecutivo se `week_number = last + 1`, reseta para 1 se pulou) e aplica `streak_bonus = LEAST(streak, 5)`. Final score = score + streak_bonus.
- Tabela `participant_streaks (participant_name, season_id, current_streak, last_week_completed)` indexa por nome lowercased+trim.

## Frontend
- `src/hooks/useWeeklyQuiz.ts`: `useWeeklyQuiz`, `useNextScheduledQuiz`, `useTrimestralProvao`, `useParticipantStreak`. Todos retornam os campos de lição.
- `src/pages/Index.tsx`: hero do **Quiz da Semana** com pílula "Lição #N", título da lição, bloco do versículo-chave, countdown até dom 23:59, streak 🔥, badge "já respondeu". Card do **Provão Trimestral** condicional (≤14 dias do fim). Versículo do dia. Status só da turma do usuário (`profile.class_id`). Atalhos para Ranking e `/arquivo`.
- `src/pages/Arquivo.tsx`: rota `/arquivo` com seletor de trimestre + turma + iniciar (provões anteriores).
- `src/pages/Quiz.tsx`: prefere quiz com janela aberta (turma do usuário); fallback para quiz legado por trimestre. Trata erro do trigger.
- `src/pages/Result.tsx`: breakdown acertos + bônus + total; streak atual e última semana concluída.
- `src/pages/Ranking.tsx`: tabs **Semana / Temporada / Trimestral**. Default `weekly`. Streak 🔥 no modo Temporada.
- `src/pages/admin/AdminQuizzes.tsx`: form com **Tipo do Quiz** (semanal/trimestral) + bloco "Lição da revista" (nº, título, vers. ref, vers. texto) visível só para semanal.

## Regras
- Cap do bônus: +5 pts (LEAST(streak, 5)).
- Quiz perdido (fora da janela): zera streak; não pode mais responder.
- Identificador de streak: nome lowercased+trim (mesmo critério do ranking).
- A turma do usuário vem de `profiles.class_id`. Sem class_id, "Status da turma" e "Quiz da Semana" não aparecem.
