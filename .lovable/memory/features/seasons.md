---
name: Seasons & Countdown
description: Sistema de temporadas com countdown global e lockout do quiz após encerramento
type: feature
---

## Estrutura
- Tabela `seasons` (id, name, start_date, end_date, status: 'active'|'closed').
- Temporada atual: **"2º TRI 2026"** encerrando em **26/06/2026 23:59 (Brasília / UTC-3)**.
- Public SELECT (necessário para countdown público). UPDATE/INSERT bloqueado por padrão (admin via SQL por enquanto).

## Hooks
- `useActiveSeason()` — retorna a temporada com status='active' mais recente.
- `useCountdown(date)` — tick 1s, retorna `{days, hours, minutes, seconds, totalMs, expired}`.

## UI
- `SeasonCountdown` — variant `full` (Index) / `compact` (header do Quiz).
- `SeasonClosedScreen` — tela de bloqueio "Quiz encerrado. Aguarde a próxima temporada."
- Últimas 24h: countdown fica vermelho (destructive).

## Lockout
- Index: `seasonExpired` bloqueia botão Iniciar e mostra card de encerramento.
- Quiz: `seasonExpired` redireciona para `SeasonClosedScreen` antes de qualquer render.

## Próximas fases (não implementadas)
- Badges automáticos, leaderboard realtime, premiação automática, reset entre temporadas.
