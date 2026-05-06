## Objetivo

No card "QUIZ DA SEMANA" da Home, exibir sempre a **lição vigente** (a partir da tabela `lessons`, considerando `scheduled_date`) e o título no formato **"Quiz semanal #{lesson_number} - {classe do usuário}"**.

Hoje a lição ativa/agendada é a **#7** (Uma Prova de Fé: A Entrega de Isaque), porém o card mostra "SEMANA #3 / Quiz Semanal #3 - Adultos" porque está usando o `week_number` e o `title` salvos no quiz (que não foram atualizados).

## Contexto encontrado

- Tabela `lessons`: tem `lesson_number=7`, `scheduled_date=2026-05-04`, `theme='Uma Prova de Fé: A Entrega de Isaque'`. É a fonte de verdade da lição vigente.
- Tabela `quizzes` (semanais ativos hoje): `week_number=3`, `lesson_number=NULL`, `lesson_title=NULL`, `title="Quiz Semanal #3 - <Classe>"`. Por isso o card mostra "#3".
- Card é renderizado em `src/pages/Index.tsx` (linhas 232-336), usando `lessonLabel` (deriva de `weeklyQuiz.lesson_number || week_number`) e `heroTitle` (`weeklyQuiz.lesson_title ?? weeklyQuiz.title`).

## Mudanças

### 1. Novo hook `useCurrentLesson` (`src/hooks/useCurrentLesson.ts`)

Retorna a lição vigente (a mais recente com `scheduled_date <= hoje`):

```ts
supabase.from("lessons")
  .select("lesson_number, theme, scheduled_date, status")
  .lte("scheduled_date", today)
  .order("scheduled_date", { ascending: false })
  .limit(1).maybeSingle();
```

Com `refetchInterval: 60_000` para acompanhar trocas de semana.

### 2. `src/pages/Index.tsx`

- Importar e usar `useCurrentLesson()`.
- Substituir o cálculo de `lessonLabel`:
  - `Lição ${currentLesson.lesson_number}` quando houver lição vigente.
  - Fallback para o comportamento atual se `lessons` vazio.
- Substituir `heroTitle` no card semanal por:
  - `Quiz semanal #${currentLesson.lesson_number} - ${userClass.name}` (sempre, quando há lição + turma).
  - Fallback: `weeklyQuiz.lesson_title ?? weeklyQuiz.title`.
- Manter a sub-linha do tema da lição (theme) como subtítulo discreto abaixo, opcional, para dar contexto (ex.: "Uma Prova de Fé: A Entrega de Isaque").

### 3. Bloco "Próxima lição" (mesmo arquivo, linhas 386-416)

Para consistência, quando houver `nextQuiz` mas `lesson_number` for NULL, derivar igualmente da tabela `lessons` (próxima `scheduled_date > hoje`). Pequeno hook adicional `useNextLesson` ou inline query.

## Detalhes técnicos

- A tabela `lessons` atualmente tem `class_id = NULL` (lição global). O hook não filtra por classe; se no futuro houver lições por turma, basta adicionar `.or("class_id.eq." + classId + ",class_id.is.null")`.
- Não alteramos o quiz no banco; apenas o **rótulo exibido**. O `quiz_id` usado para iniciar o quiz continua sendo o do `weeklyQuiz` da turma.
- Sem mudanças de schema, RLS ou edge functions.

## Resultado esperado

Card passará a mostrar:

```
QUIZ DA SEMANA
LIÇÃO 7
Quiz semanal #7 - Adultos
5 perguntas · até dom 23h59
```
