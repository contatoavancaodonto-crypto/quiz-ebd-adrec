Remodelar o sistema de rankings para substituir o conceito de "Ranking Semanal" por "Ranking da Lição", garantindo compatibilidade retroativa e atualização visual no frontend.

### Análise de Impacto

#### Views Afetadas
- `ranking_weekly`: Será preservada como alias para a nova view `ranking_lesson` para manter compatibilidade com queries existentes.
- `ranking_monthly` e `ranking_trimester_consolidated`: Serão atualizadas para garantir que a lógica de pontuação use `final_score` ou o cálculo de fallback (`score + streak_bonus`).

#### Componentes Afetados
- `WeeklyRankings.tsx`: Atualização de textos de "Semana" para "Lição".
- `WeeklyReadingCard.tsx`: Atualização de "Leitura Semanal" para "Leitura da Lição".
- `Index.tsx`: Atualização de labels de "Quiz da Semana" para "Quiz da Lição".
- `membro/Historico.tsx`: Ajuste de labels em tabelas e gráficos.

#### Hooks e Queries Afetados
- `useWeeklyQuiz.ts`: Renomear logicamente para refletir lições, mas manter nomes de exportação para evitar quebras imediatas.
- `useAcademicHistory.ts`: Ajustar interfaces que usam `semana` para suportar `lesson_number`.

### Plano de Implementação

#### Fase 1: Database (Migrations)
1. Criar a nova view `ranking_lesson` baseada no `lesson_id` e `lesson_number`.
2. Criar uma view temporária `ranking_weekly` que aponta para `ranking_lesson` (compatibilidade).
3. Atualizar `ranking_monthly` e `ranking_trimester_consolidated` para refletir as novas regras de pontuação consolidada.
4. Adicionar colunas de suporte se necessário (ex: garantir que `quiz_attempts` sempre tenha `lesson_id`).

#### Fase 2: Hooks e Lógica de Dados
1. Atualizar `src/hooks/useWeeklyQuiz.ts` e `src/hooks/useCurrentLesson.ts` para centralizar a busca baseada na lição agendada.
2. Garantir que as chamadas ao Supabase usem a nova view onde possível, mas aceitem a antiga.

#### Fase 3: Frontend e UI
1. Realizar a substituição textual estratégica:
   - "Ranking Semanal" -> "Ranking da Lição"
   - "Quiz Semanal" -> "Quiz da Lição / Versículos"
   - "Semana" -> "Lição" (contextual)
2. Atualizar componentes de exibição de ranking para mostrar o tema da lição se disponível.

#### Fase 4: Verificação
1. Validar se o ranking continua carregando na página inicial.
2. Verificar se o histórico do membro reflete as notas corretamente.
3. Testar o desempate por milissegundos nas novas views.

### Breaking Changes Potenciais
- Mudança na granularidade: Se um quiz não estiver associado a uma lição, ele pode sumir do "Ranking da Lição" se a regra for estrita. Solução: fallback para `week_number` se `lesson_id` for nulo.
