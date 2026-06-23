## Problema

Um usuário recém-criado clicou no botão central (FAB) do menu mobile e foi direto para o **Provão**, sem antes ter feito o quiz da **Lição 13**. A regra correta é:

1. Primeiro o usuário faz o **quiz da Lição 13** (clicando no FAB).
2. Só **depois** que a Lição 13 está concluída, o FAB passa a abrir o **Provão**.

## Causa

O hook `useTrimesterProgress` identifica o participante via `participants.name ILIKE fullName` (busca por nome). Se já existe outro participante com o mesmo nome que concluiu a Lição 13, o novo usuário "herda" esse progresso → `completedLesson13 = true` → `showProvaoCTA = true` → o FAB dispara o Provão imediatamente.

Além disso, o hook intencionalmente ignora `season_id`, então uma Lição 13 de trimestre anterior também desbloqueia o Provão atual indevidamente.

## Correção (escopo mínimo)

**Arquivo:** `src/hooks/useTrimesterProgress.ts`
- Adicionar parâmetro `userId: string | null | undefined`.
- Substituir o lookup por nome por `participants.user_id = userId` (sem fallback por nome — evita colisões).
- Filtrar `quiz_attempts.season_id = seasonId` quando `seasonId` estiver disponível, garantindo que Lição 13 só desbloqueia o Provão da temporada atual.
- Atualizar `queryKey` para incluir `userId` e `seasonId`.
- `enabled: !!userId`.

**Arquivo:** `src/pages/Index.tsx`
- Importar `useAuth` (já está disponível) e passar `user?.id` como primeiro argumento de `useTrimesterProgress`.
- Manter a lógica existente do FAB:
  - `showProvaoCTA = completedLesson13 && !completedExam` → abre Provão.
  - Caso contrário, abre quiz da semana / lição atual (que será a Lição 13 quando for o caso).

## Resultado esperado

- Usuário novo (sem attempt de Lição 13 vinculado ao seu `user_id` na temporada atual): FAB abre o quiz da Lição 13.
- Após concluir a Lição 13: FAB passa a abrir o Provão.
- Após concluir o Provão: FAB mostra "✅ Concluído" e leva ao histórico (comportamento já existente).

Nenhuma alteração de banco, RLS ou outros componentes.