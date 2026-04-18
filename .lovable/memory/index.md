# Project Memory

## Core
- Premium dark mode: bg #05070D, primary #4CC9E0. Brand: "1º TRI. 2026 - ADREC".
- Supabase backend. Exclude "TESTE123" (case-insensitive) in all views/queries.
- Rankings: sort by correct answers DESC, time ASC. First attempts priority.
- Quiz: 13 questions, auto-advance 0.5s after instant visual feedback.
- Temporada ativa: "2º TRI 2026" encerra 26/06/2026 23:59. Após expirar, quiz fica bloqueado.

## Memories
- [Visual Identity](mem://style/visual-identity) — Premium dark mode styling, brand, church logo, glassmorphism
- [Database Schema](mem://architecture/database-schema) — Supabase tables and ranking views
- [Acknowledgments](mem://features/acknowledgments) — Names required on the thank you screen
- [Review System](mem://features/review-system) — Post-quiz review of correct/incorrect answers ("Meu Gabarito")
- [Ranking & Retry Logic](mem://features/ranking-logic) — Double ranking, scoring, tie-breakers, and retry rules
- [Quiz Flow](mem://features/quiz-flow-and-logic) — Step-by-step quiz flow including Evaluation Break
- [Classes and Questions](mem://content/classes-and-questions) — Hardcoded class names, emojis, and availability
- [n8n Webhooks](mem://integrations/n8n-webhooks) — Three specific webhook triggers for data integration
- [Admin Dashboard](mem://features/admin-dashboard) — Hidden route /painel-ebd-2025 for analytics
- [Quiz Status Lockout](mem://features/quiz-status-lockout) — Global QUIZ_CLOSED toggle behavior
- [Seasons & Countdown](mem://features/seasons) — Tabela seasons, countdown global, lockout automático ao expirar
- [Badges System](mem://features/badges) — 4 badges automáticos via trigger ao finalizar quiz, transferíveis dentro da temporada
