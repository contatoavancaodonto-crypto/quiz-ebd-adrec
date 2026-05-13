## Objetivo

Reduzir o abandono na aba "Criar conta" do `/auth` transformando o formulário longo em um fluxo passo-a-passo (estilo Typeform), com uma pergunta por vez, animação suave e progresso visível. Também unificar "Nome" e "Sobrenome" em um único campo "Nome completo".

## Mudanças propostas

### 1. Campo único "Nome completo"
- Substituir os inputs `firstName` + `lastName` por um único `fullName`.
- No envio (`handleSignup`), fazer o split:
  - `first_name` = primeira palavra
  - `last_name` = restante (resto das palavras juntas; vazio se só houver uma palavra)
- Atualizar `signupSchema` para validar `fullName` (mín. 2 palavras recomendado, mas aceitar 1 com aviso suave; mín. 3 chars).

### 2. Fluxo step-by-step (Typeform-like)
Quebrar o formulário de signup em **7 etapas**, mostrando uma pergunta por vez com transição animada (fade + slide):

```
Step 1 → Nome completo
Step 2 → Telefone
Step 3 → Classe
Step 4 → Igreja
Step 5 → E-mail (opcional)
Step 6 → Senha
Step 7 → Termos + Atualizações + Botão "Criar conta"
```

Cada step terá:
- Pergunta grande/destacada como título.
- 1 input principal.
- Botão "Continuar" (ou Enter avança).
- Botão "Voltar" discreto.
- Validação inline antes de permitir avançar (usa o mesmo `signupSchema` aplicado por campo).

### 3. Barra de progresso
- Barra fina no topo do card de signup mostrando `step / total`.
- Texto pequeno: "Passo X de 7".
- Animar largura com `framer-motion`.

### 4. Animações (já temos `framer-motion`)
- `AnimatePresence mode="wait"` envolvendo o step ativo.
- Entrada: `x: 30, opacity: 0` → `x: 0, opacity: 1`.
- Saída: `x: -30, opacity: 0`.
- Duração ~0.25s, easing suave.
- Auto-foco no input ao entrar no step.
- Enter avança step (exceto no último, onde envia).

### 5. Login permanece igual
Nenhuma mudança na aba "Entrar" — só na aba "Criar conta". Botão Google e divisor seguem visíveis acima do fluxo.

## Detalhes técnicos

- Novo state em `Auth.tsx`: `const [signupStep, setSignupStep] = useState(0)`.
- Função `validateStep(step)` que roda apenas o pedaço relevante do schema (ex.: `signupSchema.pick({ fullName: true }).safeParse(...)`).
- Função `goNext()` valida → incrementa step. `goBack()` decrementa.
- Ao trocar de aba (login ↔ signup) ou desmontar, resetar `signupStep = 0`.
- Reaproveitar componentes existentes (`Field`, `Select`, `SearchableSelect`, `PasswordField`, `ModalCheckbox`-equivalente) — não recriar.
- Manter `SubmitButton` apenas no último step.
- O fluxo Google (botão "Continuar com Google") continua acima da barra de progresso quando `signupStep === 0`; a partir do step 1, escondemos o bloco Google + divisor para dar foco total ao step.

## Fora de escopo

- Sem mudanças em `CompleteProfileModal` (fluxo Google pós-login segue igual).
- Sem mudanças no backend, schema do banco ou e-mails.
- Sem mudanças visuais profundas (cores, tokens) — só layout/animação dentro do card existente.

## Arquivos afetados

- `src/pages/Auth.tsx` (principal — refatorar form de signup, adicionar steps, progresso, animações, unificar nome).
