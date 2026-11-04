# Serviço: Estratégia Digital

| Campo | Valor |
| ----- | ----- |
| Task | SERV-03 (#146) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/estrategia-digital` · em destaque na Home |
| No painel | **Serviços** → Estratégia Digital |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=estrategia-digital`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Estratégia Digital | 2 a 120 caracteres |
| Endereço (slug) | `estrategia-digital` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Diagnóstico, objetivos e plano de presença digital para a sua marca. | 10 a 200 caracteres (atual: 68) |
| Descrição | Analisamos o cenário da marca, definimos públicos, objetivos e canais e organizamos um plano de comunicação digital que orienta conteúdo, campanhas e métricas. | Mínimo de 20 caracteres (atual: 159) |
| Exemplos de entregas | Diagnóstico de presença digital · Plano de comunicação · Definição de indicadores | Até 12, um por linha |
| Áreas de atuação | [Social Media](../areas/social-media.md), [Copywriting](../areas/copywriting.md) | Ao menos uma publicada |
| Ícone | Estrela (`estrela`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Sim | Até 6 serviços em destaque |
| Ordem | 1 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** nenhum ainda.

## Para a Benjamin aprovar (SERV-03)

- [ ] Nome, resumo e descrição (sem conteúdo comercial inventado)
- [ ] Exemplos de entregas (Diagnóstico de presença digital, Plano de comunicação, Definição de indicadores)
- [ ] Áreas: Social Media e Copywriting
- [ ] Destaque na Home (hoje: sim)

O título e a descrição da página em buscadores e compartilhamentos saem do **Nome** e do **Resumo**;
as palavras-chave, do nome, das áreas e dos exemplos. Não há campo separado para isso.

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
