# Serviço: Eventos

| Campo | Valor |
| ----- | ----- |
| Task | SERV-05 (#148) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/eventos` |
| No painel | **Serviços** → Eventos |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=eventos`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Eventos | 2 a 120 caracteres |
| Endereço (slug) | `eventos` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Concepção, produção e cobertura de eventos. | 10 a 200 caracteres (atual: 43) |
| Descrição | Do conceito à operação no dia: planejamento, cronograma, produção, parceiros e cobertura de comunicação do evento. | Mínimo de 20 caracteres (atual: 114) |
| Exemplos de entregas | Planejamento e cronograma · Produção e operação · Cobertura do evento | Até 12, um por linha |
| Áreas de atuação | [Eventos e Parcerias](../areas/eventos-e-parcerias.md) | Ao menos uma publicada |
| Ícone | Calendário (`calendario`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Não | Até 6 serviços em destaque |
| Ordem | 3 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** nenhum ainda.

## Para a Benjamin aprovar (SERV-05)

- [ ] Nome, resumo e descrição de planejamento e produção de eventos
- [ ] Exemplos de entregas (Planejamento e cronograma, Produção e operação, Cobertura do evento)
- [ ] Área: Eventos e Parcerias

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
