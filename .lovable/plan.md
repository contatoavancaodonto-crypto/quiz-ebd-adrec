## Objetivo

Liberar o Provão Trimestral (turmas **Adultos** e **Jovens**) para qualquer usuário, agora, sem depender da janela de 7 dias do fim do trimestre, sem exigir Lição 13 e sem bloqueio por trimestre fechado. Adolescentes continua "Em construção". Quem já realizou continua bloqueado (uma tentativa por trimestre).

## Mudanças em `src/pages/Index.tsx`

1. **FAB "🏆 Provão"** — já está liberado para todos (`showProvaoCTA = !completedExam`). Sem mudança.

2. **Card "Provão Trimestral" (final da home)**:
   - `provaoIsDisabled` passa a depender só de `completedExam` (remover checagens de `PROVAO_CLOSED_TRIMESTERS` e `PROVAO_AVAILABLE_TRIMESTERS`).
   - `handleProvaoTriClick`: permitir selecionar qualquer trimestre listado, sem toast de "Em breve" / "Disponível em X dias".
   - `handleStartProvaoCard`: remover os bloqueios `PROVAO_CLOSED_TRIMESTERS.includes(...)` e `!provaoStatus.available`. Manter:
     - bloqueio "Adolescentes" → toast "🚧 Em construção".
     - bloqueio admin em turma ≠ turma de cadastro.
     - bloqueio `completedExam`.
   - Renderização do card: mostrar o botão de iniciar normalmente (não renderizar a variante "Disponível em X dias" nem "Encerrado") para Adultos/Jovens.
   - Manter `PROVAO_QUIZ_CLOSED = false` como está (kill-switch global).

3. **Compatibilidade**: manter as constantes `PROVAO_AVAILABLE_TRIMESTERS` e `PROVAO_CLOSED_TRIMESTERS` para uso interno em rótulos, mas não como gate de clique/start.

## Validação

- Usuário sem Lição 13 → FAB mostra "🏆 Provão" e abre `/quiz` direto.
- Usuário em qualquer data do trimestre → card inferior permite iniciar Adultos/Jovens.
- Usuário Adolescentes → toast "🚧 Em construção".
- Usuário que já fez → FAB "✅ Concluído" e card bloqueado.
- Admin navegando em outra turma → toast informando que pontuação só conta na turma de cadastro.

Sem mudanças no backend (a trigger `enforce_single_trimestral_attempt` já garante uma tentativa por trimestre).
