# Case: Meridiano

| Campo | Valor |
| ----- | ----- |
| Task | CASE-06 (#161) |
| Situação | **Bloqueado:** aguardando material e autorização da Benjamin (CON-07, #20) |
| No site | `/cases/meridiano`, no filtro `/cases?categoria=social-media-e-criacao` |
| No painel | **Cases e categorias** → Social media e criação para a Meridiano |

## Bloqueio

O texto abaixo é provisório, e até 01/11/2026 nenhum material do cliente está registrado no repositório
nem na issue de recebimento. Por isso o case não tem desafio, solução, resultados, galeria, links, equipe nem data: o site omite esses campos em vez
de preenchê-los com conteúdo inventado. A capa é uma ilustração provisória da marca.

Pela regra de [campos do case](../../negocio/campos-do-case.md#3-status-de-publicação-do-case), case sem
material validado fica em rascunho. No conteúdo versionado ele ainda está publicado com o selo "Conteúdo
provisório", e o go-live segue bloqueado enquanto isso não mudar
([go/no-go](../../operacao/go-no-go.md), item E4).

## Campos no painel

| Campo | Texto atual | Regra para publicar |
| ----- | ----------- | ------------------- |
| Título | Social media e criação para a Meridiano | 2 a 120 caracteres |
| Endereço (slug) | `meridiano` | Único; se mudar depois de publicado, o antigo redireciona |
| Cliente | Meridiano | Obrigatório |
| Categoria | Social Media & Criação | Obrigatória e publicada |
| Serviços | Social Media; Design e Identidade Visual | Ao menos um publicado |
| Tipo de entrega | Redes sociais | Opcional |
| Descrição | Desdobramentos visuais, criativos e estratégicos desenvolvidos para as redes sociais da Meridiano. | 30 a 280 caracteres |
| Capa | Ilustração provisória | Obrigatória, com texto alternativo |
| Desafio, solução e resultados | Sem conteúdo | Opcionais; vazios, não aparecem |
| Galeria, links, equipe e data | Sem conteúdo | Opcionais; vazios, não aparecem |

## Para a Benjamin enviar (CON-07)

- [ ] Autorização para citar o cliente Meridiano e usar as imagens e os textos do trabalho
- [ ] Título e descrição aprovados
- [ ] Confirmação da categoria: `content/cases.ts` registra que ela ainda precisa ser confirmada com o material
- [ ] Peças autorizadas para a galeria, com o texto alternativo de cada imagem
- [ ] Links das publicações, narrativa do projeto e capa

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados e o material.
2. A equipe cadastra no painel só o que foi autorizado e publica. O [guia do painel](../../cms/guia-do-painel.md#cases-admincases) explica cada campo.
3. Em `content/` (site sem banco, desenvolvimento), o case deixa de ser `provisional`, e o teste de
   conformidade (`content/itens-do-mvp.test.ts`) passa a exigir isso.

Se o material não vier até o go-live, o case sai do ar (rascunho ou arquivado) e o site segue com os demais:
segundo o backlog, cases não entregues não bloqueiam necessariamente o MVP.
