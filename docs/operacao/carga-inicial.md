# Carga inicial do conteúdo no banco

| Campo | Valor |
| ----- | ----- |
| Arquivo | [`supabase/carga-inicial.sql`](../../supabase/carga-inicial.sql), gerado por `npm run carga:write` |
| Quando | Uma vez, em banco novo, antes de o site ler o conteúdo do Supabase |
| Quem | Quem responde pelo banco, com instrução explícita do responsável (`AGENTS.md`) |

## Para que serve

Com o Supabase configurado, o site lê o conteúdo do banco. Em um banco sem conteúdo, `/servicos` e `/cases` ficam vazios,
os detalhes respondem 404 e a Home perde as listas. Foi o que aconteceu em Production em 04/11/2026.

`CONTENT_SOURCE=local` devolve o conteúdo de `content/`, mas **nada do que for editado no painel aparece no site**
enquanto ela estiver definida. Para o painel valer, o conteúdo precisa estar no banco. É isso que a carga faz.

Ela não depende de nenhuma migration nova: foi testada em banco local na versão `20261102000300` e na `20261104000100`.

## O que ela grava

As áreas, os serviços, as categorias, os cases, os CTAs e a configuração de `content/`, como o site mostra hoje, com os
estados e as marcas de provisório. As imagens são os arquivos de `public/`, registrados na biblioteca. Nenhuma senha e
nenhum dado pessoal, além dos nomes de equipe que já constam em `content/cases.ts`.

**Atenção:** os cases citam clientes cuja autorização segue pendente (CON-06 a CON-08), como já é hoje no site. Se algum
não puder aparecer, despublique no painel depois da carga.

## Como aplicar

1. Faça uma cópia do banco ([backup e recuperação](backup-e-recuperacao.md)).
2. Confirme que as migrations da `main` estão aplicadas.
3. Rode o conteúdo do arquivo no SQL Editor do projeto. É uma transação só: ou entra tudo, ou nada.
4. Na Vercel, remova `CONTENT_SOURCE=local`, se ela existir, e refaça o deploy sem cache.
5. Confira `/servicos`, `/cases`, `/servicos/estrategia-digital` e `/cases/aventura-de-construir`.

## Rodar de novo

Não sobrescreve nada (`on conflict do nothing`): o que foi editado no painel fica como está. Item que foi excluído no
painel volta, porque a linha já não existe.

## Como reverter

A carga não tem reversão própria: use a cópia do passo 1. Antes de o site ser editado, também dá para arquivar pelo painel
o que não deveria estar no ar.
