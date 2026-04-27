## Objetivo

Na página `/ranking`:

1. Trocar a aba **"Temporada"** por **"Mensal"** — mostrando apenas os pontos acumulados das semanas do **mês atual** (em America/Sao_Paulo).
2. Fazer o ranking **"Trimestral"** somar o **bônus de streak** (`final_score = score + streak_bonus`) em vez de usar só `qa.score`.

---

## O que muda

### 1. Aba "Mensal" (substitui "Temporada")

- A view `ranking_season_accumulated` continua existindo (é usada para badges e fim de temporada), **mas a UI de Ranking deixa de usá-la**.
- Criamos uma nova view **`ranking_monthly`** com a mesma estrutura da `ranking_season_accumulated`, porém filtrando `qa.finished_at` para o mês corrente (em horário de Brasília) e particionando o `position` por `(year, month)`.
- Frontend:
  - Tab label: **"Mensal"**
  - Subtítulo: **"Mês atual"** (em vez de o nome da temporada)
  - Estado vazio: **"Nenhum participante ainda neste mês."**
  - O resto da UI de cada linha (pts, semanas respondidas, streak 🔥) permanece igual.

### 2. Trimestral somando streak bonus

A view atual `ranking_general`:
- Ordena por `qa.score DESC` e mostra `qa.score / 13`.
- Filtro `qa.score >= 5`.

Nova versão da `ranking_general`:
- Adiciona a coluna `final_score = COALESCE(qa.final_score, qa.score + qa.streak_bonus)` e a coluna `streak_bonus`.
- Ordena por `final_score DESC, tempo, finished_at`.
- Mantém o filtro `qa.score >= 5` (aproveitamento mínimo de 5 acertos em 13).
- Frontend exibe o `final_score` como pontuação principal e, quando houver bônus > 0, mostra abaixo `score + bonus🔥` (mesmo padrão visual já usado na aba Semana).

Outros consumidores da view continuam funcionando porque mantemos todas as colunas atuais (`score`, `total_time_ms`, `position`, etc.) e só **adicionamos** `final_score` + `streak_bonus`. Vou conferir e manter compatível: `useSmartFeed`, `MeuDesempenho`, `Historico`, `Quiz` (esses usam `score`, `position`, `participant_name`, `class_name` — nada quebra).

---

## Detalhes técnicos

### Migration SQL (resumo)

```sql
-- 1) ranking_general com soma do streak_bonus
DROP VIEW IF EXISTS public.ranking_general CASCADE;
CREATE VIEW public.ranking_general
WITH (security_invoker = on) AS
SELECT
  qa.id AS attempt_id,
  qa.score,
  qa.streak_bonus,
  COALESCE(qa.final_score, qa.score + qa.streak_bonus) AS final_score,
  qa.total_time_seconds,
  qa.total_time_ms,
  qa.accuracy_percentage,
  qa.finished_at,
  p.name AS participant_name,
  c.id AS class_id,
  c.name AS class_name,
  ch.id AS church_id,
  ch.name AS church_name,
  q.trimester,
  false AS is_retry,
  row_number() OVER (
    PARTITION BY q.trimester
    ORDER BY
      COALESCE(qa.final_score, qa.score + qa.streak_bonus) DESC,
      COALESCE(NULLIF(qa.total_time_ms,0), qa.total_time_seconds*1000) ASC,
      qa.finished_at ASC
  ) AS position
FROM quiz_attempts qa
JOIN participants p ON p.id = qa.participant_id
JOIN classes c ON c.id = p.class_id
JOIN quizzes q ON q.id = qa.quiz_id
LEFT JOIN profiles pr ON pr.id::text = p.id::text
LEFT JOIN churches ch ON ch.id = pr.church_id
WHERE qa.finished_at IS NOT NULL
  AND qa.score >= 5
  AND upper(p.name) <> 'TESTE123';

-- 2) ranking_monthly (acumulado do mês corrente)
DROP VIEW IF EXISTS public.ranking_monthly CASCADE;
CREATE VIEW public.ranking_monthly
WITH (security_invoker = on) AS
WITH agg AS (
  SELECT
    lower(trim(part.name)) AS name_key,
    min(part.name) AS participant_name,
    qa.season_id,
    sum(qa.final_score) AS total_score,
    sum(qa.total_time_ms) AS total_time_ms,
    count(DISTINCT qa.week_number) AS weeks_completed,
    max(qa.finished_at) AS last_finished_at
  FROM quiz_attempts qa
  JOIN participants part ON part.id = qa.participant_id
  WHERE qa.finished_at IS NOT NULL
    AND date_trunc('month', qa.finished_at AT TIME ZONE 'America/Sao_Paulo')
        = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))
  GROUP BY lower(trim(part.name)), qa.season_id
),
joined AS (
  SELECT a.*, pr.church_id, ch.name AS church_name,
         pr.class_id, c.name AS class_name,
         ps.current_streak
  FROM agg a
  LEFT JOIN profiles pr
    ON lower(trim((pr.first_name||' ')||COALESCE(pr.last_name,''))) = a.name_key
  LEFT JOIN churches ch ON ch.id = pr.church_id
  LEFT JOIN classes c ON c.id = pr.class_id
  LEFT JOIN participant_streaks ps
    ON ps.participant_name = a.name_key AND ps.season_id = a.season_id
)
SELECT
  row_number() OVER (
    ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC
  ) AS position,
  participant_name, season_id, class_id, class_name,
  church_id, church_name, total_score, total_time_ms,
  weeks_completed, COALESCE(current_streak, 0) AS current_streak
FROM joined;
```

### Frontend (`src/pages/Ranking.tsx`)

- Renomear o tipo `Mode = "weekly" | "season" | "classic"` → `"weekly" | "monthly" | "classic"` e atualizar o `useSearchParams` para aceitar `mode=monthly` (com fallback de `season` → `monthly` para não quebrar links antigos).
- Trocar `from("ranking_season_accumulated")` por `from("ranking_monthly")` e remover o filtro `.eq("season_id", ...)` (a view já filtra pelo mês).
- Trocar a label da Tab para **"Mensal"** e o subtítulo para **"Mês atual"**.
- Mensagem de empty: **"Nenhum participante ainda neste mês."**
- Na renderização da linha do modo Trimestral (`classic`):
  - Usar `entry.final_score` como número grande (em vez de `entry.score`).
  - Manter `/13` ao lado.
  - Quando `entry.streak_bonus > 0`, mostrar abaixo `score + bonus🔥` (mesmo visual da aba Semana).

### Arquivos editados

- **Migration nova** (criar via tool): atualiza `ranking_general` e cria `ranking_monthly`.
- **`src/pages/Ranking.tsx`**: tabs, queries, labels e renderização do modo classic.

### Não muda

- `ranking_season_accumulated` continua existindo (badges, `award_season_end_badges`, `useSmartFeed` etc.).
- `useSmartFeed`, `MeuDesempenho`, `Historico`, `Quiz` continuam usando `ranking_general` sem alteração (apenas ganham acesso a `final_score` se quiserem).
