## Correção crítica: respostas do quiz não validadas corretamente

### Problema
- Existem **duas funções `submit_answer`** no banco (sobrecarga). A versão antiga `(uuid, uuid, text)` só lê de `public.questions` e o PostgREST pode resolvê-la em vez da nova, falhando silenciosamente para lições importadas via `/versiculos`.
- Lições criadas em `/versiculos` armazenam perguntas em `lessons.questions` (JSONB) mas **não sincronizam** para `public.questions`. Resultado: `submit_answer` antiga não acha a pergunta → resposta marcada errada.
- A coluna `answers.question_id` é `NOT NULL UUID`, então perguntas com IDs não-UUID (ex.: `2f1yuimg3`) não conseguem ser inseridas.
- `get_attempt_gabarito` faz JOIN só com `public.questions`, então o gabarito pós-quiz fica vazio para lições do `/versiculos`.

### Solução

**1. Migração SQL**
- `DROP FUNCTION public.submit_answer(uuid, uuid, text)` — remove sobrecarga antiga.
- Tornar `answers.question_id` nullable e adicionar `question_ref text` para suportar IDs do JSON.
- Ajustar índice único de `answers` para `(attempt_id, COALESCE(question_id::text, question_ref))`.
- Reescrever `submit_answer(uuid, text, text)` única:
  - Prioridade 1: busca em `public.questions` por UUID.
  - Prioridade 2: busca no JSON `lessons.questions` por `id`, com COALESCE de variantes (`respostaCorreta`, `correct_option`, `correctOption`, `resposta_correta`).
  - Comparação case-insensitive.
  - Insere usando `question_id` (UUID) ou `question_ref` (texto) conforme o caso.
- Reescrever `get_attempt_gabarito` para:
  - JOIN com `questions` quando `question_id` existir.
  - Fallback: ler do JSON `lessons.questions` quando só houver `question_ref`, mapeando `pergunta`/`alternativas`/`respostaCorreta` para os campos retornados.
- Migração retroativa: popular `public.questions` espelhando o JSON de lições antigas (idempotente, só cria se não existir).

**2. Sincronização futura no `/versiculos`**
- No `AdminVerses` (salvar lição), após upsert em `lessons`, espelhar perguntas em `public.questions` (delete + insert por `lesson_id`) para manter compatibilidade total.

**3. Validação**
- Rodar quiz da lição "Uma Prova de Fé" (`1895101c-…`).
- Conferir que `answers.is_correct` reflete o `respostaCorreta` do JSON.
- Abrir "Meu Gabarito" e validar que aparece corretamente.
- Criar nova lição em `/versiculos`, simular quiz, validar fluxo completo.

### Arquivos afetados
- Migração SQL (nova).
- `src/pages/admin/AdminVerses.tsx` (sincronizar `questions` ao salvar lição).
- Nenhuma mudança no `Quiz.tsx` — ele já chama `submit_answer` com `text`.
