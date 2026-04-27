## Painel do Admin de Igreja

Cria a experiência completa para usuários com role `admin` (com `church_id` definido) — sem nenhuma capacidade de superadmin. Tudo escopado à própria igreja.

### O que entra no menu lateral (só aparece para admin de igreja)

```
Painel Admin
├─ Visão Geral (já existe — vai mostrar dados da igreja dele)
├─ Minha Igreja            ← NOVO
├─ Membros da Igreja       ← NOVO
├─ Admins Locais           ← NOVO
├─ Tentativas              (já existe, já filtra por igreja)
├─ Respostas Membros       (já existe, já filtra por igreja)
└─ Materiais               (já existe)
```

Itens `superadminOnly` continuam ocultos. Voltar ao app e Sair seguem no rodapé.

### 1. Visão Geral filtrada
Reaproveita `AdminOverview.tsx`. Quando `isSuperadmin = false` e `churchId` existe, os contadores passam a ser:
- Membros da igreja
- Turmas com membros da igreja
- Tentativas finalizadas (membros da igreja)
- Média de acertos da igreja
- Última semana ativa

Cabeçalho mostra o nome da igreja.

### 2. Minha Igreja (`/painel-ebd-2025/minha-igreja`)
Tela com formulário pré-preenchido (nome, pastor presidente, telefone do solicitante, área).

- Os campos são **editáveis**, mas salvar **não altera direto** a tabela `churches`.
- Cria um registro em uma nova tabela `church_edit_requests` com status `pending`.
- Mostra histórico de solicitações (pendentes / aprovadas / rejeitadas) com data e quem revisou.
- Avisa o admin: "Sua alteração será aplicada após aprovação do superadmin."

### 3. Membros da Igreja (`/painel-ebd-2025/membros`)
Lista todos os perfis com `church_id = churchId`:
- Nome, e-mail, telefone, turma, área, status (ativo).
- Busca por nome/e-mail.
- Badge "Admin" se já tem role admin nessa igreja.
- Botão "Promover a admin" / "Remover admin" (ver item 4).

### 4. Admins Locais (`/painel-ebd-2025/admins-locais`)
- Lista quem tem `user_roles.role='admin'` E `church_id = minha igreja`.
- Pode promover qualquer membro da própria igreja (insere row em `user_roles` com `role='admin'` e `church_id` fixo na sua igreja).
- Pode remover (deleta a row).
- Não pode mexer em superadmins nem em admins de outras igrejas.

### 5. Notificação em tempo real para o superadmin
- Adiciona um sino no topo do painel quando `isSuperadmin = true`.
- Conta solicitações `pending` em `church_edit_requests` (realtime via `postgres_changes`).
- Clicando vai para `/painel-ebd-2025/igrejas?tab=solicitacoes` (nova aba dentro de `AdminChurches.tsx`) onde o superadmin aprova/rejeita; ao aprovar, os campos são copiados para `churches`.

---

## Detalhes técnicos

### Banco

Nova tabela `church_edit_requests`:
```
id, church_id, requested_by (auth.uid()),
proposed_name, proposed_pastor_president,
proposed_requester_phone, proposed_requester_area,
status text default 'pending',
reviewed_by, reviewed_at, review_note,
created_at, updated_at
```

RLS:
- Admin da igreja: SELECT/INSERT só onde `church_id = current_admin_church_id()`.
- Superadmin: SELECT/UPDATE em tudo.

Função `current_admin_church_id()` já existe — reutilizar.

Mudanças nas RLS de `user_roles` para permitir admin de igreja gerenciar admins **da própria igreja**:
- INSERT: `has_role(auth.uid(),'admin') AND role='admin' AND church_id = current_admin_church_id()`
- DELETE: idem (só remove admin com mesmo church_id, e nunca superadmin).

### Componentes
- `src/pages/admin/AdminMyChurch.tsx`
- `src/pages/admin/AdminChurchMembers.tsx`
- `src/pages/admin/AdminLocalAdmins.tsx`
- Atualizar `AdminSidebar.tsx` (3 itens novos, ocultos do superadmin? não — superadmin já tem `/igrejas` e `/usuarios`; deixar visíveis só quando `!isSuperadmin && isChurchAdmin`).
- Atualizar `App.tsx` (3 rotas novas).
- Atualizar `AdminOverview.tsx` para variante "minha igreja".
- Atualizar `AdminChurches.tsx`: nova aba "Solicitações de edição" com aprovar/rejeitar.
- Novo componente `PendingRequestsBell.tsx` no `AdminLayout` para superadmin.

### Segurança
- `AdminGuard` continua garantindo `isAdmin` (superadmin ou church admin).
- Cada query nas novas páginas filtra explicitamente por `churchId` (vindo de `useRoles`).
- Nenhuma rota `superadminOnly` é exposta a admin de igreja.
