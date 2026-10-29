# Serviço: Assessoria de Imprensa / PR

| Campo | Valor |
| ----- | ----- |
| Task | SERV-10 (#153) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/assessoria-de-imprensa` · em destaque na Home |
| No painel | **Serviços** → Assessoria de Imprensa / PR |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=assessoria-de-imprensa`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Assessoria de Imprensa / PR | 2 a 120 caracteres |
| Endereço (slug) | `assessoria-de-imprensa` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Relacionamento com a imprensa e reputação. | 10 a 200 caracteres (atual: 42) |
| Descrição | Elaboração de pautas e releases, relacionamento com veículos, preparação de porta-vozes e acompanhamento de publicações (clipping). | Mínimo de 20 caracteres (atual: 131) |
| Exemplos de entregas | Pautas e releases · Media training · Clipping | Até 12, um por linha |
| Áreas de atuação | [Assessoria de Imprensa](../areas/assessoria-de-imprensa.md) | Ao menos uma publicada |
| Ícone | Megafone (`megafone`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Sim | Até 6 serviços em destaque |
| Ordem | 8 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** Assessoria de imprensa para a FECAP (`/cases/fecap`).

## Para a Benjamin aprovar (SERV-10)

- [ ] Nome ("Assessoria de Imprensa / PR"), resumo e descrição — informações corretas sobre o que
      a agência entrega
- [ ] Exemplos de entregas (Pautas e releases, Media training, Clipping)
- [ ] Área: Assessoria de Imprensa
- [ ] Case relacionado: Assessoria de imprensa para a FECAP

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
