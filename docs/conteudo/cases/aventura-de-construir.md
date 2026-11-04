# Case: Aventura de Construir

| Campo | Valor |
| ----- | ----- |
| Task | CASE-05 (#160) |
| Situação | **Bloqueado:** aguardando material e autorização da Benjamin (CON-06, #19) |
| No site | `/cases/aventura-de-construir`, no filtro `/cases?categoria=copywriting` |
| No painel | **Cases** → Conteúdo para o blog Aventura de Construir |

## Bloqueio

O texto abaixo é provisório, e até 01/11/2026 nenhum material do cliente está registrado no repositório
nem na issue de recebimento. Por isso o case não tem desafio, solução, resultados, galeria, links, equipe nem data: o site omite esses campos em vez
de preenchê-los com conteúdo inventado. A capa é uma ilustração provisória da marca.

Pela regra de [campos do case](../../negocio/campos-do-case.md#3-status-de-publicação-do-case), case sem
material validado fica em rascunho. No conteúdo versionado ele ainda está publicado como provisório, e o
go-live segue bloqueado enquanto isso não mudar
([go/no-go](../../operacao/go-no-go.md), item E4).

## Campos no painel

| Campo | Texto atual | Regra para publicar |
| ----- | ----------- | ------------------- |
| Título | Conteúdo para o blog Aventura de Construir | 2 a 120 caracteres |
| Endereço (slug) | `aventura-de-construir` | Único; se mudar depois de publicado, o antigo redireciona |
| Cliente | Aventura de Construir | Obrigatório |
| Categoria | Copywriting | Obrigatória e publicada |
| Serviços | Copywriting; Produção de Conteúdo | Ao menos um publicado |
| Tipo de entrega | Artigos para blog | Opcional |
| Descrição | Artigos e textos desenvolvidos pela Agência Benjamin para o blog Aventura de Construir. | 30 a 280 caracteres |
| Capa | Ilustração provisória | Obrigatória, com texto alternativo |
| Desafio, solução e resultados | Sem conteúdo | Opcionais; vazios, não aparecem |
| Galeria, links, equipe e data | Sem conteúdo | Opcionais; vazios, não aparecem |

## Para a Benjamin enviar (CON-06)

- [ ] Autorização para citar o cliente Aventura de Construir e usar as imagens e os textos do trabalho
- [ ] Título e descrição aprovados
- [ ] Links das publicações do blog: um por linha, no formato `Título do artigo | https://…`
- [ ] Desafio, solução e entregas do projeto, se a Benjamin quiser contar a história do trabalho
- [ ] Capa e, se houver, peças para a galeria, com o texto alternativo de cada imagem

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados e o material.
2. A equipe cadastra no painel só o que foi autorizado e publica. O [guia do painel](../../cms/guia-do-painel.md#cases-admincases) explica cada campo.
3. Em `content/` (site sem banco, desenvolvimento), o case deixa de ser `provisional`, e o teste de
   conformidade (`content/itens-do-mvp.test.ts`) passa a exigir isso.

Se o material não vier até o go-live, o case sai do ar (rascunho ou arquivado) e o site segue com os demais:
segundo o backlog, cases não entregues não bloqueiam necessariamente o MVP.
