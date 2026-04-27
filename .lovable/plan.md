## Objetivo

Refazer a home para refletir o novo fluxo: a rotina principal é o **quiz semanal de 5 perguntas (lição da revista, libera segunda 00h00, encerra domingo 23h59)**, e o **provão trimestral de 13 perguntas** vira um evento que só aparece em destaque na última semana de cada trimestre. Cada quiz semanal passa a representar uma **lição da revista** (nº, título, versículo-chave).

---

## O que muda na home

```text
┌─────────────────────────────────────┐
│  Header (logo + saudação)           │
├─────────────────────────────────────┤
│  HERO — Quiz da Semana              │
│   Lição #N · "Título da lição"      │
│   📖 Versículo-chave: Jo 3:16       │
│   🔥 Streak  ⏳ Encerra dom 23h59   │
│   [ Responder Quiz da Semana ]      │
├─────────────────────────────────────┤
│  (Só aparece nas últimas 2 semanas  │
│   do trimestre)                     │
│  PROVÃO TRIMESTRAL — 13 perguntas   │
│   [ Acessar provão ]                │
├─────────────────────────────────────┤
│  Versículo do Dia (mantido)         │
├─────────────────────────────────────┤
│  Status da MINHA turma              │
│   (1 card só, da turma do perfil)   │
├─────────────────────────────────────┤
│  [ 🏆 Ver Ranking ]                 │
├─────────────────────────────────────┤
│  Link "Arquivo trimestral →"        │
│  (vai para /arquivo)                │
└─────────────────────────────────────┘
```

Removido da home: bloco "Status por turma" com 3 cards, `<details>` Arquivo trimestral inline (vira página).

---

## Trabalho a fazer

### 1. Banco de dados — vincular quiz semanal a uma lição

Adicionar colunas em `quizzes` para representar a lição da revista:
- `lesson_number` (int, nullable) — nº da lição no trimestre (1..13)
- `lesson_title` (text, nullable) — título da lição
- `lesson_key_verse_ref` (text, nullable) — ex.: "João 3:16"
- `lesson_key_verse_text` (text, nullable) — texto do versículo-chave
- `quiz_kind` (text, default `'weekly'`) — `'weekly'` ou `'trimestral'`, para distinguir os 5 perguntas semanais do provão de 13

Quizzes legados ficam como `weekly` por padrão (comportamento atual preservado).

### 2. Página nova `/arquivo`

Mover o conteúdo do `<details> Arquivo trimestral` (seletor de trimestre + turma + botão "Iniciar Tri.") para uma rota dedicada `/arquivo`. A home só mantém um link discreto "Arquivo trimestral →".

### 3. Card "Provão Trimestral" condicional

Novo card que só aparece quando faltarem **≤ 14 dias** para o fim da temporada (`season.end_date`). Usa o quiz com `quiz_kind = 'trimestral'` da turma do usuário. Antes disso fica oculto.

### 4. Hero do Quiz da Semana — enriquecer

Atualizar `useWeeklyQuiz` para retornar também `lesson_number`, `lesson_title`, `lesson_key_verse_ref`. No hero exibir:
- Pílula "Lição #N" no topo (substitui "Quiz da Semana #N")
- Título: o `lesson_title` (com fallback para `quiz.title`)
- Linha sutil com o versículo-chave da lição (📖 ref)

### 5. Status da turma — só 1 card

Em vez de listar todas as turmas ativas, renderizar `ClassWeeklyStatusCard` apenas para a turma do usuário (`profile.class_id`). Se o usuário não tem turma definida, esconder a seção.

### 6. Painel admin — campos de lição

Em `/painel-ebd-2025/quizzes`, adicionar no formulário de quiz:
- Seletor `Tipo`: Semanal / Provão Trimestral
- Campos `Nº da Lição`, `Título da Lição`, `Versículo-chave (ref)`, `Texto do versículo-chave`

Esses campos são opcionais (legado continua funcionando).

### 7. Memória do projeto

- Atualizar `mem://features/weekly-quizzes` com a nova estrutura (lição + provão trimestral condicional + arquivo separado).
- Criar nota em `mem://features/daily-verse-pivot`: **futuro** — substituir `DailyVerseCard` aleatório pelo "Versículo da Semana" baseado em `lesson_key_verse_*` do quiz semanal corrente. Não implementar agora.
- Atualizar `mem://index.md` (Core) para refletir: quiz semanal de 5 perguntas = padrão; provão trimestral de 13 = evento de fim de trimestre.

---

## Detalhes técnicos

**Migração SQL** (adiciona colunas, nada destrutivo):
```sql
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS lesson_number INT,
  ADD COLUMN IF NOT EXISTS lesson_title TEXT,
  ADD COLUMN IF NOT EXISTS lesson_key_verse_ref TEXT,
  ADD COLUMN IF NOT EXISTS lesson_key_verse_text TEXT,
  ADD COLUMN IF NOT EXISTS quiz_kind TEXT NOT NULL DEFAULT 'weekly'
    CHECK (quiz_kind IN ('weekly','trimestral'));
```

**Cron `tick_weekly_quiz_schedule`**: filtrar fila de promoção por `quiz_kind = 'weekly'` para que o provão trimestral não seja consumido como quiz semanal automático.

**Hero — fonte de dados**:
- `useWeeklyQuiz(classId)` já retorna o quiz aberto da turma; estender o select para incluir os 4 novos campos.
- `useTrimestralProvao(classId, seasonId)` (novo): retorna o quiz com `quiz_kind='trimestral'` da temporada/turma; só renderiza se `season.end_date - now <= 14 dias`.

**Rota `/arquivo`**: adicionar em `src/App.tsx` e mover o JSX do `<motion.details>` atual para `src/pages/Arquivo.tsx` (mesmas regras de `AVAILABLE_TRIMESTERS` / `CLOSED_TRIMESTERS`).

**Arquivos afetados**:
- `supabase/migrations/*` — nova migração
- `src/hooks/useWeeklyQuiz.ts` — campos extras + novo hook `useTrimestralProvao`
- `src/pages/Index.tsx` — hero enriquecido, card provão condicional, status só da turma do usuário, remoção do `<details>`
- `src/pages/Arquivo.tsx` — novo
- `src/App.tsx` — nova rota
- `src/pages/admin/AdminQuizzes.tsx` — novos campos no form
- `src/integrations/supabase/types.ts` — regenerado automaticamente
- `.lovable/memory/features/weekly-quizzes.md`, `.lovable/memory/index.md`, `.lovable/memory/features/daily-verse-pivot.md`

---

## Fora de escopo (fica para depois, mas registrado em memória)

- Substituir `DailyVerseCard` aleatório pelo versículo-chave da lição da semana.
- Notificações/lembrete por e-mail quando abre quiz semanal.
- Página dedicada para revisar a lição da semana (texto/PDF da revista).
