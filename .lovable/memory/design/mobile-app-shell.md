---
name: Mobile-app shell global
description: Padrão app-like aplicado em TODO o app (não só home). Header híbrido (full|back) + bottom nav, hero gradiente por seção, cards com cantos generosos
type: design
---
Todo o app de membro segue padrão mobile-first com cara de app nativo. Inspirado em apps tipo "Minha Bíblia" / "YouVersion", mas com identidade própria.

## Componentes do shell

### `src/components/membro/AppHeader.tsx`
Header reutilizável com 2 variantes:
- **`variant="full"`**: logo + branding "EBD Online · CIMADSETA · ADREC" + sino (atalho histórico) + avatar (atalho perfil). Usado em páginas de nível 1 (Home, Ranking, Perfil).
- **`variant="back"`**: botão voltar à esquerda + título centralizado + subtítulo opcional. Estilo iOS. Usado em páginas internas e drill-downs.

Sempre `md:hidden` (esconde no desktop), sticky, com `safe-area-inset-top` e `backdrop-blur-xl`.

### `MemberLayout` (`src/components/membro/MemberLayout.tsx`)
Props chave:
- `mobileHeader`: `{ variant: "full" } | { variant: "back", title, subtitle?, backTo?, onBack? } | { variant: "none" }`
  - Default: `back` com o `title` da página
- `bottomNav`: `false` ou `{ showFab, onFabClick, fabLabel }`
- `contentPaddingMobile`: bool (default true). Setar `false` quando a página controla seu próprio padding (Home, Perfil, Ranking).

### `MobileBottomNav`
Bottom nav fixa só no mobile com 5 slots: Início | Ranking | [FAB Quiz central] | Bíblia | Perfil. **Esconder (`bottomNav={false}`) em telas de leitura/imersão**: capítulo da Bíblia, hino aberto, Quiz, Result, Gabarito.

## Padrão visual recorrente

### Hero por seção
Toda página interna abre com um hero card `rounded-3xl p-5` em gradient temático:
- Indigo→blue: Bíblia
- Rose→red: Harpa  
- Amber→orange: Revista
- Emerald→green: Histórico
- Slate-700→slate-900: Configurações
- Primary→secondary: Perfil
- Custom warm: Quiz/Início

Padrão interno: tag uppercase em cima (`text-[10px] uppercase tracking-widest opacity-80 font-bold`), título grande em `font-bold` ou `font-display font-extrabold`, subtítulo `text-xs opacity-90`. Ícone gigante `opacity-25` no canto direito como decoração.

### Listas e info rows
- Cards `rounded-2xl bg-card border border-border`
- Listas usam `divide-y divide-border` dentro do card
- "Section labels" minúsculos: `text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1`

### Tiles/grids
- `rounded-2xl` ou `rounded-3xl`
- Ícone em quadradinho `rounded-xl` ou `rounded-2xl` colorido com gradient
- Ações com `active:scale-[0.98]` ou `whileTap={{ scale: 0.95 }}` (framer-motion)

### Telas de fluxo (Quiz/Result/Gabarito)
- Não usam MemberLayout (são imersivas)
- Header próprio sticky com `safe-area-inset-top`
- Sem bottom nav
- Padding lateral mínimo `px-4`

## Regras
- Sempre tokens semânticos do design system (`text-foreground`, `bg-card`, `text-primary`)
- Cores vibrantes nos heros/tiles são exceção contextual, OK
- Nunca cores hardcoded fora dos heros decorativos
- Mobile primeiro: `md:` é o desktop override
- z-index: bottom nav 40, modais 50, app header 30
