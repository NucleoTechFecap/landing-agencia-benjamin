# Área: Criação

| Campo | Valor |
| ----- | ----- |
| Task | SOB-09 (#142) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/areas#criacao` — seção 5 da página de áreas |
| No painel | **Áreas de atuação** → Criação |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Criação | 2 a 120 caracteres |
| Endereço (slug) | `criacao` | Fixo depois da primeira publicação |
| Resumo | Identidade visual, design, direção criativa e produção audiovisual. | 10 a 200 caracteres (atual: 67) |
| Descrição | Dá forma às ideias com identidade visual, peças gráficas, direção criativa e produção audiovisual. | Mínimo de 20 caracteres (atual: 98) |
| Destaques | Identidade visual · Design e direção criativa · Produção audiovisual | Até 12, um por linha |
| Ícone | Raio (`raio`) | Um dos 14 ícones oficiais |
| Ordem | 5 | Menor aparece primeiro |

## Relações

- **Serviços desta área** (vínculo feito no cadastro do serviço): [Produção de Conteúdo](../servicos/producao-de-conteudo.md), [Design e Identidade Visual](../servicos/design-e-identidade-visual.md), [Audiovisual](../servicos/audiovisual.md).

## Para a Benjamin aprovar (SOB-09)

- [ ] Nome da área e posição na página (5ª de 6)
- [ ] Resumo e descrição: identidade visual, design, direção criativa e audiovisual
- [ ] Destaques (Identidade visual, Design e direção criativa, Produção audiovisual)
- [ ] Ícone **Raio** — recurso visual da área, das 6 cores oficiais (a cor muda por seção)
- [ ] Serviços que nascem da área: Produção de Conteúdo, Design e Identidade Visual e Audiovisual

A seção de áreas não exibe foto: os recursos visuais são o ícone oficial e a cor da seção, como
no brandbook. Se a Benjamin quiser uma imagem por área, isso é um campo novo (fora do MVP).

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
