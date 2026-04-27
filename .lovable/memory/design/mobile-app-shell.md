---
name: Mobile-first app shell
description: Home redesign mobile-app style with bottom nav + FAB, app header, hero greeting card, and tool tiles grid
type: design
---
A home (Index.tsx) e o MemberLayout foram redesenhados para parecer um app mobile nativo, com inspiração na referência enviada pelo usuário (apps tipo "Minha Bíblia").

## Padrões obrigatórios na home (mobile-first)

### Header app-like (mobile only — `md:hidden`)
- Sticky no topo, `bg-background/80 backdrop-blur-xl`
- Respeita `padding-top: env(safe-area-inset-top)`
- Esquerda: mini-logo + "EBD Online · CIMADSETA · ADREC"
- Direita: ícone Bell (atalho histórico) + avatar circular com inicial (atalho perfil)
- Sidebar desktop fica escondida no mobile via `hidden md:flex` no MemberLayout

### MemberLayout
- Aceita `hideMobileHeader` para páginas com header próprio
- Aceita `bottomNav={false | { showFab, onFabClick, fabLabel }}` para configurar a barra inferior
- Sidebar só aparece em `md+`

### MobileBottomNav (`src/components/membro/MobileBottomNav.tsx`)
- 5 colunas: 2 itens à esquerda, FAB central elevado, 2 itens à direita
- Itens: Início, Ranking, [FAB Quiz], Bíblia, Perfil
- FAB usa `gradient-primary`, é elevado (-translate-y-5), com glow
- Item ativo: scale-110 + cor `text-primary`
- Respeita `padding-bottom: env(safe-area-inset-bottom)`
- Spacer de h-20 só no mobile pra conteúdo não ficar atrás

### Hero saudação
- Card grande arredondado (`rounded-3xl`) com gradient secondary→primary
- "Bom dia/Boa tarde/Boa noite" em uppercase + "Oi, {firstName} 👋" em fonte display extra-bold
- Ícone decorativo de livro com opacity-20 no canto
- Pílula de streak em white/15 quando streak > 0

### Section labels
- Componente local `SectionLabel` com barra colorida vertical (1×3.5) + texto uppercase pequeno
- Cores: primary, secondary, warning (amber), success (emerald), muted
- Padrão visual da referência (CONTINUAR LEITURA, FERRAMENTAS PRINCIPAIS)

### Grid de ferramentas (2x2)
- Cards `rounded-2xl` com `bg-gradient-to-br` vibrante diferente para cada
- Indigo→blue (Bíblia), rose→red (Harpa), amber→orange (Revista), emerald→green (Histórico)
- Ícone grande no topo, label+desc no rodapé, blob blur decorativo
- min-h-[120px] pra consistência

## Regras
- Sempre usar tokens semânticos do design system (text-foreground, bg-card etc)
- Cores vibrantes nos tiles são exceção contextual e aceitas
- Bottom nav deve ficar `fixed bottom-0` no mobile com z-40
- Header app deve ser z-30 (abaixo do bottom nav e abaixo de modais)
