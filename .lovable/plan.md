
# Sistema de Suporte e Sugestões

Página onde o membro abre um "ticket" (bug, sugestão, dúvida ou ajuda) e o superadmin gerencia/responde tudo num painel dedicado.

## 1. Banco de dados

Nova tabela `support_tickets` (não reaproveitar a `suggestions` antiga, que é só texto solto e sem RLS de leitura pelo dono):

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | FK lógica para `auth.users` (dono do ticket) |
| user_name | text | snapshot do nome no momento do envio |
| user_email | text | snapshot |
| church_id | uuid | snapshot da igreja |
| category | text | `bug` \| `suggestion` \| `question` \| `other` |
| priority | text | `low` \| `normal` \| `high` (auto: bug=high) |
| subject | text | até 120 chars |
| message | text | até 2000 chars |
| screenshot_url | text nullable | upload opcional (bucket `support`) |
| page_url | text nullable | URL onde estava ao abrir |
| user_agent | text nullable | para debug de bug |
| status | text | `open` \| `in_progress` \| `resolved` \| `closed` |
| admin_response | text nullable | resposta do superadmin |
| resolved_by | uuid nullable | |
| resolved_at | timestamptz nullable | |
| created_at, updated_at | timestamptz | |

Nova tabela `support_ticket_messages` (thread de conversa entre membro e superadmin):
- id, ticket_id, author_id, author_role (`user`/`admin`), body, created_at.

**RLS:**
- `support_tickets`: 
  - SELECT: dono (`user_id = auth.uid()`) **ou** superadmin.
  - INSERT: autenticado, `user_id = auth.uid()`.
  - UPDATE: superadmin (status, admin_response, resolved_*).
  - DELETE: superadmin.
- `support_ticket_messages`: SELECT pelo dono do ticket ou superadmin; INSERT pelo dono do ticket ou superadmin.

**Bucket de storage** `support` (público read, insert por autenticado) para anexar 1 screenshot.

**Realtime** habilitado nas duas tabelas para o painel atualizar sozinho e o membro ver respostas em tempo real.

**Notificação automática:** trigger que, ao inserir `admin_response` ou nova mensagem do admin, cria registro em `notifications` (escopo `user`) — reaproveitando o sistema de sino que já existe. (Se o escopo `user` ainda não existir no enum/check, adicionar.)

## 2. Página do membro — `/membro/suporte`

Nova rota com layout `MemberLayout`. Conteúdo:

**Topo:** hero curto "Como podemos ajudar?".

**Formulário** (validado com `zod`):
- Categoria (cards selecionáveis com ícone): Bug, Sugestão, Dúvida, Outro.
- Assunto (input, max 120).
- Descrição (textarea, max 2000, contador).
- Anexar print (opcional, upload para bucket `support`).
- Botão "Enviar". Captura automática de `page_url` e `user_agent` quando categoria = bug.

**Abaixo do form: "Meus chamados"** — lista dos tickets do usuário com badge de status colorido, categoria e data. Clique abre um drawer com a thread de mensagens (membro pode responder enquanto status ≠ `closed`).

Toast de confirmação no envio + atualização realtime quando o admin responde.

## 3. Entrada no menu (membro)

- `MemberSidebar.tsx`: adicionar item **"Suporte"** (ícone `LifeBuoy`) após "Configurações", no fim da lista (parte de baixo do menu, como solicitado).
- Não adicionar ao `MobileBottomNav` (já tem 4 itens + FAB); fica acessível via sidebar/drawer mobile.

## 4. Painel superadmin — `/painel/suporte`

Nova página `AdminSupport.tsx` + entrada na `AdminSidebar` (ícone `LifeBuoy`, `superadminOnly`).

**Layout:**
- Cards de KPI no topo: Abertos, Em andamento, Resolvidos hoje, Tempo médio de resposta.
- Filtros: status, categoria, prioridade, busca por texto/usuário.
- Tabela de tickets (assunto, usuário, igreja, categoria, prioridade, status, criado em).
- Clique abre **drawer/dialog** com:
  - Detalhes (incluindo `page_url`, `user_agent`, screenshot).
  - Thread de mensagens (admin pode responder).
  - Ações: mudar status, definir prioridade, marcar como resolvido (preenche `resolved_by/resolved_at` e dispara notificação ao membro).

Atualização realtime via `supabase.channel`.

## 5. Detalhes técnicos

- Arquivos novos:
  - `src/pages/membro/Suporte.tsx`
  - `src/pages/admin/AdminSupport.tsx`
  - `src/components/suporte/TicketForm.tsx`
  - `src/components/suporte/TicketThread.tsx`
  - `src/hooks/useSupportTickets.ts`
  - Migração SQL (tabelas, RLS, bucket, trigger de notificação, realtime).
- Edições:
  - `src/App.tsx` — rotas `/membro/suporte` e `/painel/suporte`.
  - `src/components/membro/MemberSidebar.tsx` — item "Suporte".
  - `src/components/admin/AdminSidebar.tsx` — item "Suporte" (superadmin).
- Validação com `zod` no front; limites de tamanho também no SQL via trigger (evitar CHECK com funções não imutáveis).
- Filtra `TESTE123` nas listagens administrativas, conforme regra do projeto.

## Decisões a confirmar antes de implementar
