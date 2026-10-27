# Serviço: Comunicação Interna

| Campo | Valor |
| ----- | ----- |
| Task | SERV-11 (#154) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/comunicacao-interna` |
| No painel | **Serviços** → Comunicação Interna |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=comunicacao-interna`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Comunicação Interna | 2 a 120 caracteres |
| Endereço (slug) | `comunicacao-interna` | Fixo depois da primeira publicação |
| Resumo | Engajamento e alinhamento de times. | 10 a 200 caracteres (atual: 35) |
| Descrição | Diagnóstico de comunicação interna, campanhas para colaboradores, canais internos e ações de clima e engajamento. | Mínimo de 20 caracteres (atual: 113) |
| Exemplos de entregas | Campanhas internas · Canais e rituais · Ações de engajamento | Até 12, um por linha |
| Áreas de atuação | Comunicação Interna | Ao menos uma publicada |
| Ícone | Comentário (`comentario`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Não | Até 6 serviços em destaque |
| Ordem | 9 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** nenhum ainda.

## Para a Benjamin aprovar (SERV-11)

- [ ] Nome, resumo e descrição
- [ ] Exemplos de entregas (Campanhas internas, Canais e rituais, Ações de engajamento)
- [ ] Área: Comunicação Interna

Disponível e editável no painel (ADM-06): todos os campos acima, áreas, destaque e ordem.

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
