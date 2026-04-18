---
name: Realtime Leaderboard
description: Ranking ao vivo via Supabase Realtime com animação de reordenação
type: feature
---

## Backend
- `quiz_attempts` adicionada à publication `supabase_realtime`.
- `REPLICA IDENTITY FULL` para receber payload completo em UPDATEs.

## Hook
- `useRealtimeRanking(queryKey)` — escuta `postgres_changes` em `quiz_attempts`, debounce de 600ms, invalida a query do React Query.

## UI
- Página `/ranking` usa `LayoutGroup` + `motion.div layout` + `AnimatePresence` para animar reordenação.
- Key estável: `attempt_id` (cai em `participant_name + class_id` se ausente).
- Indicador "AO VIVO" pulsante no topo da página.
- Spring transition: stiffness 350, damping 30.

## Como testar
- Abrir `/ranking` em duas abas.
- Finalizar quiz em uma → outra anima a entrada/reordenação automaticamente.
