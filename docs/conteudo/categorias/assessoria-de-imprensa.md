# Categoria de cases: Assessoria de Imprensa

| Campo | Valor |
| ----- | ----- |
| Task | CASE-10 (#165) |
| Situação | Nome e descrição aprovados no documento de requisitos (PRJ §12) |
| No site | Filtro de `/cases?categoria=assessoria-de-imprensa` |
| No painel | **Cases e categorias** → **Categorias** → Assessoria de Imprensa |

## Campos no painel

| Campo | Texto atual | Regra para publicar |
| ----- | ----------- | ------------------- |
| Nome | Assessoria de Imprensa | 2 a 120 caracteres |
| Endereço (slug) | `assessoria-de-imprensa` | Fixo depois da primeira publicação |
| Descrição | Releases, pautas, publicações, clippings e matérias conquistadas. | Opcional |
| Ordem | 3 | Menor aparece primeiro nos filtros |

## Cases nesta categoria

- **Assessoria de imprensa para a FECAP** (`/cases/fecap`) — cliente FECAP; entrega: Releases e publicações; links externos: 0.

## Para a Benjamin aprovar (CASE-10)

- [ ] Nome e descrição da categoria
- [ ] Clippings do case FECAP (CON-08): para cada matéria, título, link, **veículo** e **data da
      publicação**, no formato `Título | https://… | Veículo | AAAA-MM-DD`

Os links de imprensa aceitam os metadados de publicação (veículo e data), exibidos na página do
case e na API pública.

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
