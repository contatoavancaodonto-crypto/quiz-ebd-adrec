## Adicionar logo e emblema da marca Quiz EBD

Dois ativos recebidos:
- **Logo completa "Quiz EBD"** (com tagline APRENDER • RESPONDER • CRESCER) — fundo branco
- **Emblema** (escudo + livro + troféu + ?) — fundo transparente

Como o tema do app é **dark mode premium** (#05070D), a logo completa tem fundo branco que destoa. Vou usá-la em contextos claros (e-mails, splash claro) e usar o emblema (transparente) em todo o resto do app dark.

### Upload dos assets
Subir os dois para CDN via `lovable-assets` e criar pointers em `src/assets/`:
- `src/assets/quizebd-logo.png.asset.json`
- `src/assets/quizebd-emblema.png.asset.json`

### Locais estratégicos

**Emblema (transparente — para o app dark)**
1. **`index.html`** — favicon + apple-touch-icon + OG image (substituir placeholder atual)
2. **`src/pages/Auth.tsx`** — topo da tela de login (centralizado, ~80px)
3. **`src/components/admin/AdminSidebar.tsx`** — header da sidebar admin ao lado do título
4. **`src/components/membro/AppHeader.tsx`** — mobile header pequeno (28-32px) ao lado do nome do usuário
5. **`src/components/PageSkeleton.tsx`** / loading states — emblema com pulse animation enquanto carrega
6. **`src/components/ThankYouScreen.tsx`** — emblema grande no topo como assinatura
7. **`src/pages/NotFound.tsx`** — emblema acima do "404"

**Logo completa (com fundo claro)**
1. **`supabase/functions/_shared/email-templates/_brand.ts`** — substituir/atualizar logo em todos os e-mails transacionais (welcome, quiz-result, notification, etc.) via upload para bucket público `email-assets`
2. **`src/pages/Oferta.tsx`** (se tiver seção clara) — logo completa no header

**Não usar a logo branca em:** telas dark do app (Ranking, Quiz, Index, Comunidade), pois o retângulo branco quebra o visual premium. Nessas, fica só o emblema.

### Detalhes técnicos
- Pointers via `lovable-assets create --file /mnt/user-uploads/... --filename <nome>.png`
- E-mails: usar `supabase--storage_upload` para subir a logo completa em bucket `email-assets` (público) e referenciar URL pública nos templates
- Favicon: substituir `<link rel="icon">` em `index.html` para apontar para o emblema CDN
- Manter `<meta og:image>` apontando para a logo completa (melhor em previews sociais com fundo branco)

### Memória
Atualizar `mem://style/visual-identity` com:
- Emblema usado em superfícies dark
- Logo completa usada em e-mails e contextos light
- Caminhos dos asset pointers

Confirma a estratégia? Se sim, implemento; se preferir outros locais (ex: usar a logo completa em algum lugar específico, ou pular os e-mails nesta rodada), me diz antes.