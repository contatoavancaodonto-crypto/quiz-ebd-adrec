## Problema

Hoje a Bíblia e a Harpa demoram para abrir porque:

- **Bíblia (`biblia-acf.json`)**: 3,9 MB carregados via `import` no topo do arquivo.
- **Harpa (`harpa-crista.json`)**: 517 KB carregados da mesma forma.

Mesmo com lazy-load da rota, ao clicar em "Bíblia" o navegador precisa baixar e parsear ~4 MB de JSON antes de mostrar a tela. Em rede 4G isso facilmente passa de 2-3 segundos. No celular, o parse do JSON também trava a UI.

Além disso, esses 4 MB são baixados de novo toda vez que o usuário entra (sem cache eficiente), pois são embutidos no bundle JS.

## Solução

Mover os dois JSONs para **assets estáticos servidos sob demanda**, com cache do navegador e cache em memória. A página abre **instantaneamente** mostrando o esqueleto, e os dados chegam em segundo plano (geralmente em <500ms na 2ª visita, pois ficam em cache).

### O que muda na prática para o usuário

1. Clicar em "Bíblia" ou "Harpa" → tela aparece **na hora** com um pequeno indicador "Carregando livros…".
2. Na primeira visita: 0,5-1,5s para os dados aparecerem.
3. Nas próximas visitas: **instantâneo** (cache do navegador + cache em memória da sessão).
4. A busca, navegação por capítulo/hino e leitura ficam idênticas.

## Mudanças técnicas

### 1. Mover JSONs para `public/data/`

```text
public/data/biblia-acf.json   (servido como /data/biblia-acf.json)
public/data/harpa-crista.json (servido como /data/harpa-crista.json)
```

Removendo do bundle JS, esses arquivos passam a ser baixados **só quando** o usuário entra na página, com cache HTTP do navegador.

### 2. Hooks com fetch + cache em memória

Criar `src/hooks/useBibliaData.ts` e `src/hooks/useHarpaData.ts` usando React Query. Vantagens:

- Cache em memória durante a sessão (segunda abertura = instantâneo).
- `staleTime: Infinity` (dados não mudam).
- Loading state limpo.

### 3. Refatorar `Biblia.tsx` e `Harpa.tsx`

- Remover `import bibliaData from "@/data/biblia-acf.json"`.
- Usar o hook e mostrar um esqueleto leve enquanto carrega.
- Manter exatamente a mesma UI/UX.

### 4. Pré-carregar em hover/foco (opcional, ganho extra)

Nos links de menu ("Bíblia", "Harpa"), disparar o fetch em `onMouseEnter` / `onTouchStart`. Quando o usuário clica, os dados já estão chegando ou já chegaram.

## Resultado esperado

| Cenário | Antes | Depois |
|---|---|---|
| Primeiro clique em Bíblia (4G) | 2-4s tela em branco | Tela na hora + dados em ~1s |
| Segundo clique na mesma sessão | 1-2s | Instantâneo |
| Bundle JS inicial do app | inclui ~4 MB de JSON | 4 MB removidos |

Ganho colateral: o **app inteiro** fica mais leve para baixar na primeira visita (-4 MB do bundle), o que melhora o tempo de abertura inicial em todas as páginas.

## Arquivos afetados

- `src/pages/membro/Biblia.tsx` — refatorar para hook
- `src/pages/membro/Harpa.tsx` — refatorar para hook
- `src/hooks/useBibliaData.ts` — novo
- `src/hooks/useHarpaData.ts` — novo
- `src/data/biblia-acf.json` → mover para `public/data/`
- `src/data/harpa-crista.json` → mover para `public/data/`
- `src/components/membro/MobileBottomNav.tsx` e `MemberSidebar.tsx` — adicionar prefetch em hover (opcional)
