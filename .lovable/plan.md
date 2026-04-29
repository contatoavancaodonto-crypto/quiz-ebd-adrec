## Objetivo

Remover a imagem de capa do card "Jovens" na aba **Professores** da página de Revistas (`/membro/revista`).

## Alteração

No arquivo `src/pages/membro/Revista.tsx`, dentro do array `STATIC_PROFESSORES`, remover a propriedade `cover` do item com `id: "jovens-prof"`.

Sem a propriedade `cover`, o componente `RevistaCard` já trata o fallback automaticamente exibindo um ícone de livro (`BookOpen`) no lugar da imagem.

## Detalhes técnicos

- Linhas afetadas: 91-97 (item `jovens-prof` em `STATIC_PROFESSORES`)
- Remover apenas a linha `cover: revistaJovens,`
- O import `revistaJovens` permanece pois ainda é usado pelo card "Jovens" da aba Alunos
