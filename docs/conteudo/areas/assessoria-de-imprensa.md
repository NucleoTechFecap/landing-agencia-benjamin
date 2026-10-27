# Área: Assessoria de Imprensa

| Campo | Valor |
| ----- | ----- |
| Task | SOB-10 (#143) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/areas#assessoria-de-imprensa` — seção 6 da página de áreas |
| No painel | **Áreas de atuação** → Assessoria de Imprensa |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Assessoria de Imprensa | 2 a 120 caracteres |
| Endereço (slug) | `assessoria-de-imprensa` | Fixo depois da primeira publicação |
| Resumo | Relacionamento com a mídia, pautas, porta-vozes e releases. | 10 a 200 caracteres (atual: 59) |
| Descrição | Constrói pontes entre organizações e veículos de comunicação: pautas, releases, preparação de porta-vozes e relacionamento institucional. | Mínimo de 20 caracteres (atual: 137) |
| Destaques | Relacionamento com a mídia · Pautas e releases · Gestão de porta-vozes | Até 12, um por linha |
| Ícone | Megafone (`megafone`) | Um dos 14 ícones oficiais |
| Ordem | 6 | Menor aparece primeiro |

## Relações

- **Serviços desta área** (vínculo feito no cadastro do serviço): [Assessoria de Imprensa / PR](../servicos/assessoria-de-imprensa.md).

## Para a Benjamin aprovar (SOB-10)

- [ ] Nome da área e posição na página (6ª de 6)
- [ ] Resumo e descrição: relacionamento com a mídia, pautas, releases e porta-vozes
- [ ] Destaques (Relacionamento com a mídia, Pautas e releases, Gestão de porta-vozes)
- [ ] Ícone **Megafone**
- [ ] Serviço que nasce da área: Assessoria de Imprensa / PR

Os dados da área já são administráveis no painel (ADM-07): nome, textos, destaques, ícone, ordem
e estado de publicação.

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
