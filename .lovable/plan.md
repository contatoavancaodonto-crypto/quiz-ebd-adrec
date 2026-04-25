## Objetivo

Transformar a EBD de **1 prova por trimestre** para **N quizzes semanais** definidos pelo admin, recompensando alunos consistentes com **multiplicador de sequência (streak)** e exibindo **dois rankings**: o da semana corrente e o acumulado da temporada.

---

## Como vai funcionar (visão do aluno)

1. **Tela inicial**: além do trimestre, mostra um card "Quiz da Semana" com o tema, prazo e seu streak atual (ex: "🔥 3 semanas seguidas").
2. **Janela fixa**: cada quiz semanal tem `opens_at` e `closes_at` definidos pelo admin. Fora da janela, o quiz não pode ser respondido — perdeu, perdeu, e o streak zera.
3. **Resultado**: ao terminar, mostra os pontos da semana + bônus do streak ("Você ganhou +3 pts por estar há 3 semanas seguidas!").
4. **Ranking**: duas abas no topo — **Semana atual** (só quem respondeu esta semana) e **Temporada** (soma de todas as semanas + bônus).

## Como vai funcionar (visão do admin)

- Nova tela `/admin/quizzes-semanais` (ou aba dentro de Quizzes) onde o admin cadastra cada quiz com:
  - Título da semana ("Semana 3 — Êxodo")
  - Turma (Adultos, Jovens, Adolescentes)
  - Trimestre/temporada
  - Data de abertura e data de fechamento
  - Banco de questões (mantém o fluxo atual de cadastro de questões)
- Pode criar quantas semanas quiser por trimestre (não precisa ser 13 fixas).

---

## Regras de pontuação (proposta)

| Item | Pontos |
|---|---|
| Cada acerto na semana | 1 ponto (mantém atual) |
| Bônus de streak (resposta dentro da janela) | +N pontos, onde N = nº de semanas consecutivas (cap em +5 para não inflacionar) |
| Quebra de streak | Zera o contador, sem penalidade nos pontos já conquistados |
| Quiz perdido (fora da janela) | 0 pts naquela semana + zera streak |

**Exemplo**: aluno acertou 10/13 na semana 4 e está em streak de 3 semanas → ganha 10 (acertos) + 3 (streak) = **13 pts** na semana.

Tie-breaker do ranking continua: pontos > tempo total > primeiro a finalizar.

---

## Mudanças no banco (técnico)

**Novas colunas na tabela `quizzes`:**
- `week_number` (int, nullable) — 1, 2, 3...
- `opens_at` (timestamptz, nullable)
- `closes_at` (timestamptz, nullable)
- `season_id` (uuid, nullable, FK lógico para `seasons`)

Quizzes legados (sem `opens_at`) continuam funcionando como "quiz único do trimestre" — retrocompatível.

**Novas colunas em `quiz_attempts`:**
- `week_number` (int, nullable) — copiado do quiz na hora de iniciar
- `streak_at_attempt` (int, default 0) — quantas semanas consecutivas o aluno já tinha
- `streak_bonus` (int, default 0) — pontos bônus aplicados
- `final_score` (int, generated) — `score + streak_bonus`

**Nova tabela `participant_streaks`:**
```
participant_name (text, lowercased) | season_id | current_streak | last_week_completed | updated_at
```
PK composta (participant_name, season_id). Usamos `participant_name` (lowercased+trim) porque é a chave que o app usa hoje em rankings (a tabela `participants` é descartável por sessão).

**Nova função/trigger `update_streak_on_finish`** (AFTER UPDATE em `quiz_attempts` quando `finished_at` vira NOT NULL):
- Lê `week_number` da attempt.
- Se for `last_week_completed + 1` → incrementa streak.
- Senão → reseta para 1.
- Calcula `streak_bonus = LEAST(current_streak, 5)`.
- Atualiza `streak_at_attempt` e `streak_bonus` na própria attempt.

**Trigger `enforce_quiz_window`** (BEFORE INSERT em `quiz_attempts`):
- Se o quiz tem `opens_at`/`closes_at` definidos e `now()` está fora → REJECT com erro claro.

**Novas views para ranking:**
- `ranking_weekly` — filtra attempts da semana corrente (quizzes onde now() está entre opens_at e closes_at), ordena por `final_score DESC, total_time_ms ASC`.
- `ranking_season_accumulated` — soma `final_score` por `participant_name` dentro da temporada, ordena, separa por turma e geral.

---

## Mudanças no frontend (técnico)

**Novos hooks:**
- `useCurrentWeekQuiz(classId, seasonId)` — retorna o quiz com janela ativa agora.
- `useParticipantStreak(participantName, seasonId)` — retorna streak atual.
- `useWeeklyRanking(weekQuizId)` — ranking da semana corrente.
- `useSeasonRanking(seasonId, scope)` — ranking acumulado.

**Páginas atualizadas:**
- `src/pages/Index.tsx`: substitui card de trimestre por **card "Quiz da Semana"** mostrando título, contador até `closes_at`, streak atual e botão Iniciar (desabilitado se fora da janela).
- `src/pages/Quiz.tsx`: lê `week_number` do quiz e injeta na attempt; guarda streak no momento do início.
- `src/pages/Result.tsx`: mostra breakdown — "Acertos: 10 | Streak: 3 semanas (+3) | **Total: 13 pts**" e mensagem de incentivo se streak ≥ 3.
- `src/pages/Ranking.tsx`: adiciona **tabs "Semana" / "Temporada"** acima do scope (geral/igreja). Default em "Semana".

**Páginas novas:**
- `src/pages/admin/AdminWeeklyQuizzes.tsx`: lista quizzes semanais por temporada/turma com data abertura/fechamento. CRUD completo. Reaproveita o componente de cadastro de questões já existente.

**Memória persistente:**
- `mem://features/weekly-quizzes` — documenta a regra (janela fixa, streak, bônus).
- Atualiza `mem://features/ranking-logic` (a memória atual será criada/atualizada com as duas abas).

---

## Fases de implementação

**Fase 1 — Backend** (migration única)
- Adiciona colunas em `quizzes` e `quiz_attempts`.
- Cria tabela `participant_streaks` + RLS público read / trigger-only write.
- Cria triggers `update_streak_on_finish` e `enforce_quiz_window`.
- Cria views `ranking_weekly` e `ranking_season_accumulated`.

**Fase 2 — Admin**
- Tela de cadastro de quiz semanal com campos de janela.
- Migra os 3 quizzes existentes para `week_number=1` da temporada atual (script SQL pontual, mantém histórico).

**Fase 3 — Aluno**
- Card "Quiz da Semana" no Index.
- Tela de Result mostrando streak e bônus.
- Bloqueio fora da janela com mensagem clara.

**Fase 4 — Ranking**
- Abas Semana / Temporada na página de Ranking.
- Indicador visual de streak ao lado do nome no ranking (🔥3, 🔥7).

---

## Riscos e decisões abertas

- **Identificador do streak**: usamos nome do participante (lowercased+trim) — mesma estratégia do ranking atual. Quando o sistema migrar para 100% autenticado por `auth.uid`, refatoramos para usar `profile_id`.
- **Quizzes antigos sem janela**: continuam funcionando como sempre (não bloqueiam). Só os novos com `opens_at` definido aplicam a regra.
- **Cap do bônus em +5**: evita que alguém com streak de 13 ganhe +13 pts e domine o ranking apenas por consistência. Você pode ajustar esse valor depois.
- **"Perdeu, perdeu" é rígido**: confirme se quer mesmo essa rigidez ou prefere uma janela de tolerância (ex: 24h após o fechamento sem streak).

Aprove o plano para eu começar pela Fase 1 (migration + triggers).