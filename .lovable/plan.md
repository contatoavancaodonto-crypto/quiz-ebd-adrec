## Objetivo
Corrigir dois regressos no quiz:
1. A alternativa correta deve aparecer somente em verde, sem qualquer flash vermelho.
2. A próxima questão deve avançar automaticamente após o feedback validado, como antes.

## Plano
1. **Reorganizar o fluxo de confirmação da resposta em `src/pages/Quiz.tsx`**
   - Separar o estado de “opção clicada” do estado de “resposta confirmada”.
   - Impedir que a UI entre em modo de correção antes do retorno da validação.
   - Usar `isSubmitting` para travar clique duplo enquanto a resposta é enviada.

2. **Corrigir a lógica visual do feedback**
   - Mostrar verde apenas quando a alternativa tiver sido validada como correta.
   - Mostrar vermelho somente para erro real, nunca durante o tempo de espera da RPC.
   - Garantir que ícones e estilos sigam o mesmo critério, sem estado intermediário inconsistente.

3. **Restaurar o avanço automático no momento certo**
   - Fazer o timer de autoavanço depender da resposta já validada, não apenas do clique.
   - Manter o delay curto de feedback visual antes de avançar/finalizar automaticamente.
   - Preservar o comportamento da última pergunta e da pausa de avaliação no meio do quiz.

4. **Validar o comportamento final**
   - Confirmar no código que o avanço automático volta a ocorrer.
   - Verificar que o feedback correto não passa mais por vermelho em nenhum ramo do fluxo.

## Detalhes técnicos
- O problema atual acontece porque `setConfirmed(true)` é disparado antes do retorno de `submit_answer`.
- Como o estilo usa `confirmed` imediatamente, a opção clicada pode cair temporariamente na regra vermelha antes de `revealedCorrect` ser preenchido.
- O autoavanço também dispara cedo demais porque o `useEffect` observa `confirmed`, não a conclusão real da validação.
- A correção será feita só no frontend, principalmente em `src/pages/Quiz.tsx`, sem expandir escopo para backend.