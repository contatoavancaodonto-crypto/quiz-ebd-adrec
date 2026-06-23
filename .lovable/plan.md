Origem do erro:
- O botão FAB inicia o Provão sem `quizId`, usando a RPC `get_trimestral_provao_questions` para montar as 26 perguntas.
- A RPC quebra porque a coluna `lessons.trimester` no banco é `text`, mas a função declara `v_trimester` como `integer` e faz comparação `l.trimester = v_trimester`. Isso gera: `operator does not exist: text = integer`.
- Depois disso, o frontend cai em fallbacks de quiz normal e tenta consultar `.eq("id", quizId)` com `quizId` vazio (`""`), causando o segundo erro: `invalid input syntax for type uuid: ""`.
- Portanto, a correção anterior resolveu parte do fluxo, mas não tratou a incompatibilidade de tipo da RPC nem bloqueou todos os fallbacks quando o Provão está sem `quizId`.

Plano de correção alternativa:
1. Corrigir a função do banco `get_trimestral_provao_questions`:
   - Trocar a lógica para comparar `trimester` como texto de forma explícita (`'2'`/`p_trimester::text` ou cast seguro).
   - Não depender de `SELECT trimester INTO v_trimester` com tipo errado.
   - Manter a regra crítica: 2 perguntas garantidas por lição 1–13 e resultado final embaralhado com `ORDER BY random()`.

2. Blindar o frontend em `Quiz.tsx`:
   - Quando `isTrimestral` for verdadeiro e a RPC falhar ou vier vazia, parar o carregamento com mensagem específica do Provão, sem cair nos fallbacks de quiz/lição.
   - Garantir que nenhuma consulta UUID rode quando `quizId` estiver vazio.

3. Ajustar início pelo FAB em `Index.tsx`:
   - Antes de iniciar o Provão sem `quizId`, limpar o store e setar explicitamente `quizKind = "trimestral"`, `totalQuestions = 26`, `trimester = 2`, `seasonId` e dados do participante.
   - Se existir um registro de quiz trimestral, ainda assim priorizar o mesmo fluxo RPC do Provão para evitar depender de `quizId`.

4. Validar:
   - Chamar a RPC no banco para a turma do usuário e confirmar retorno de 26 questões, sendo 2 por lição 1–13.
   - Validar que o fluxo do `/quiz` não tenta mais consultar UUID vazio.
   - Confirmar que o botão "🏆 Provão" abre o quiz em vez de voltar para home com "Erro ao carregar quiz."