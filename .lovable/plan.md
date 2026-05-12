# Plano para estabilizar o domínio quizebd.com

## Objetivo
Identificar por que o domínio caiu mesmo após ter ficado ativo e definir a correção exata no provedor de DNS.

## O que já foi confirmado
- O site publicado está no ar e responde normalmente.
- A publicação está pública.
- `www.quizebd.com` está resolvendo para um IP compatível com a hospedagem.
- O domínio raiz `quizebd.com` está resolvendo para dois IPs ao mesmo tempo:
  - `185.158.133.1`
  - `2.57.91.91`

## Diagnóstico provável
Há um registro DNS conflitante no domínio raiz. Quando parte dos resolvedores entrega `2.57.91.91` em vez do IP correto, o acesso oscila ou cai. Isso explica o comportamento de “indo e voltando” e depois ficar offline.

## Próximos passos recomendados
1. Revisar os registros DNS do domínio raiz no seu provedor.
2. Remover qualquer registro `A`, `AAAA` ou redirecionamento antigo que faça `quizebd.com` apontar para `2.57.91.91`.
3. Manter apenas a configuração correta para a raiz e para `www` conforme o setup atual do domínio.
4. Após salvar, aguardar a propagação e validar novamente a resolução do domínio.

## O que deve existir no DNS
- `A` para `@` apontando para `185.158.133.1`
- `A` para `www` apontando para `185.158.133.1`
- O TXT de verificação do domínio, se a plataforma ainda exigir
- Nenhum outro `A`/`AAAA` concorrente para `@`

## Detalhes técnicos
- O comportamento atual indica split de resolução DNS.
- `www.quizebd.com` responde com redirecionamento para `https://quizebd.com/`, então se a raiz falha, a experiência inteira aparenta estar offline.
- O problema não parece estar no app nem na publicação, e sim no apontamento do domínio raiz.

## Resultado esperado
Depois de remover o IP conflitante e deixar apenas o apontamento correto, o domínio deve voltar a ficar estável sem alternância entre online e offline.