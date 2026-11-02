# Case: FECAP

| Campo | Valor |
| ----- | ----- |
| Task | CASE-07 (#162) |
| Situação | **Bloqueado:** aguardando material e autorização da Benjamin (CON-08, #21) |
| No site | `/cases/fecap`, no filtro `/cases?categoria=assessoria-de-imprensa` |
| No painel | **Cases e categorias** → Assessoria de imprensa para a FECAP |

## Bloqueio

O texto abaixo é provisório, e até 01/11/2026 nenhum material do cliente está registrado no repositório
nem na issue de recebimento. Por isso o case não tem desafio, solução, resultados, galeria, links, equipe nem data: o site omite esses campos em vez
de preenchê-los com conteúdo inventado. A capa é uma ilustração provisória da marca.

Este case é da Agência Benjamin para a FECAP. O NúcleoTech desenvolve a plataforma e não aparece como autor do trabalho.

Pela regra de [campos do case](../../negocio/campos-do-case.md#3-status-de-publicação-do-case), case sem
material validado fica em rascunho. No conteúdo versionado ele ainda está publicado como provisório, e o
go-live segue bloqueado enquanto isso não mudar
([go/no-go](../../operacao/go-no-go.md), item E4).

## Campos no painel

| Campo | Texto atual | Regra para publicar |
| ----- | ----------- | ------------------- |
| Título | Assessoria de imprensa para a FECAP | 2 a 120 caracteres |
| Endereço (slug) | `fecap` | Único; se mudar depois de publicado, o antigo redireciona |
| Cliente | FECAP | Obrigatório |
| Categoria | Assessoria de Imprensa | Obrigatória e publicada |
| Serviços | Assessoria de Imprensa / PR | Ao menos um publicado |
| Tipo de entrega | Releases e publicações | Opcional |
| Descrição | Releases, pautas e conteúdos publicados no site da FECAP e conquistados em veículos externos pela Agência Benjamin. | 30 a 280 caracteres |
| Capa | Ilustração provisória | Obrigatória, com texto alternativo |
| Desafio, solução e resultados | Sem conteúdo | Opcionais; vazios, não aparecem |
| Galeria, links, equipe e data | Sem conteúdo | Opcionais; vazios, não aparecem |

## Para a Benjamin enviar (CON-08)

- [ ] Autorização para citar a FECAP e usar as imagens e os textos do trabalho
- [ ] Título e descrição aprovados
- [ ] Clippings: para cada matéria, título, link, **veículo** e **data da publicação**, no formato `Título | https://… | Veículo | AAAA-MM-DD`
- [ ] Métricas, só se existirem e estiverem autorizadas: o site não mostra número sem fonte
- [ ] Capa e, se houver, peças para a galeria, com o texto alternativo de cada imagem

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados e o material.
2. A equipe cadastra no painel só o que foi autorizado e publica. O [guia do painel](../../cms/guia-do-painel.md#cases-admincases) explica cada campo.
3. Em `content/` (site sem banco, desenvolvimento), o case deixa de ser `provisional`, e o teste de
   conformidade (`content/itens-do-mvp.test.ts`) passa a exigir isso.

Se o material não vier até o go-live, o case sai do ar (rascunho ou arquivado) e o site segue com os demais:
segundo o backlog, cases não entregues não bloqueiam necessariamente o MVP.
