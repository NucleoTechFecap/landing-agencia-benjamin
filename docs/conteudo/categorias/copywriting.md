# Categoria de cases: Copywriting

| Campo | Valor |
| ----- | ----- |
| Task | CASE-08 (#163) |
| Situação | Nome e descrição aprovados no documento de requisitos (PRJ §12) |
| No site | Filtro de `/cases?categoria=copywriting` |
| No painel | **Cases e categorias** → **Categorias** → Copywriting |

## Campos no painel

| Campo | Texto atual | Regra para publicar |
| ----- | ----------- | ------------------- |
| Nome | Copywriting | 2 a 120 caracteres |
| Endereço (slug) | `copywriting` | Fixo depois da primeira publicação |
| Descrição | Artigos, textos e narrativas desenvolvidos pela Agência Benjamin. | Opcional |
| Ordem | 1 | Menor aparece primeiro nos filtros |

## Cases nesta categoria

- **Conteúdo para o blog Aventura de Construir** (`/cases/aventura-de-construir`) — cliente Aventura de Construir; entrega: Artigos para blog; links externos: 0.

## Para a Benjamin aprovar (CASE-08)

- [ ] Nome e descrição da categoria
- [ ] Links das publicações do blog Aventura de Construir (CON-06): um por linha no case, no
      formato `Título do artigo | https://…` — aparecem como "links externos" na página do case

A categoria filtra os cases em `/cases?categoria=copywriting` e cada case dela aceita até 10 links
para publicações externas (artigos, textos publicados em blogs e portais).

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
