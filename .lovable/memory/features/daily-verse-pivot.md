---
name: Daily Verse — pivot futuro
description: Plano de migrar o "Versículo do Dia" aleatório para "Versículo da Semana" baseado na lição corrente.
type: feature
---

## Estado atual
`DailyVerseCard` (`src/components/DailyVerseCard.tsx`) usa `useDailyVerse` → `get_or_create_daily_verse()` que sorteia aleatoriamente da tabela `verses` e fixa por dia em `daily_verse`.

## Pivot planejado (NÃO implementar até ser pedido)
Trocar a fonte para o **versículo-chave da lição da semana corrente**:
- Buscar o quiz semanal aberto da turma do usuário (`useWeeklyQuiz`).
- Renderizar `lesson_key_verse_ref` + `lesson_key_verse_text` em vez do sorteio.
- Renomear visualmente para "Versículo da Semana".
- Fallback para `useDailyVerse` quando o usuário não tem turma ou quando o quiz semanal não tem `lesson_key_verse_*`.

## Onde mexer (quando for hora)
- `src/components/DailyVerseCard.tsx` — adicionar prop opcional `weeklyOverride` ou criar `WeeklyVerseCard`.
- `src/pages/Index.tsx` — usar a fonte semanal por padrão.

## Por que não fizemos agora
Primeiro completar a reorganização da home semanal e o cadastro de lições no admin. Migrar quando os primeiros quizzes semanais já tiverem `lesson_key_verse_*` preenchidos.
