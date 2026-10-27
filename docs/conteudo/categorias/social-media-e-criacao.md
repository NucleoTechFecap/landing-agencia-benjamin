# Categoria de cases: Social Media & Criação

| Campo | Valor |
| ----- | ----- |
| Task | CASE-09 (#164) |
| Situação | Nome e descrição aprovados no documento de requisitos (PRJ §12) |
| No site | Filtro de `/cases?categoria=social-media-e-criacao` |
| No painel | **Cases e categorias** → **Categorias** → Social Media & Criação |

## Campos no painel

| Campo | Texto atual | Regra para publicar |
| ----- | ----------- | ------------------- |
| Nome | Social Media & Criação | 2 a 120 caracteres |
| Endereço (slug) | `social-media-e-criacao` | Fixo depois da primeira publicação |
| Descrição | Desdobramentos visuais, criativos e estratégicos para as redes sociais dos clientes. | Opcional |
| Ordem | 2 | Menor aparece primeiro nos filtros |

## Cases nesta categoria

- **Social media e criação para a Meridiano** (`/cases/meridiano`) — cliente Meridiano; entrega: Redes sociais; links externos: 0.

## Para a Benjamin aprovar (CASE-09)

- [ ] Nome e descrição da categoria
- [ ] Peças autorizadas do case Meridiano (CON-07) para a galeria

A categoria é administrável no painel (**Categorias**, ADM-08) e funciona no filtro da listagem
`/cases?categoria=social-media-e-criacao`.

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
