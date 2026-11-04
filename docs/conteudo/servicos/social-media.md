# Serviço: Social Media

| Campo | Valor |
| ----- | ----- |
| Task | SERV-04 (#147) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/social-media` · em destaque na Home |
| No painel | **Serviços** → Social Media |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=social-media`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Social Media | 2 a 120 caracteres |
| Endereço (slug) | `social-media` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Planejamento, produção e gestão de redes sociais. | 10 a 200 caracteres (atual: 49) |
| Descrição | Calendário editorial, criação de posts e vídeos curtos, publicação e acompanhamento de resultados em Instagram, TikTok e LinkedIn. | Mínimo de 20 caracteres (atual: 130) |
| Exemplos de entregas | Calendário editorial · Posts e vídeos curtos · Relatórios de desempenho | Até 12, um por linha |
| Áreas de atuação | [Social Media](../areas/social-media.md) | Ao menos uma publicada |
| Ícone | Coração (`coracao`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Sim | Até 6 serviços em destaque |
| Ordem | 2 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** Social media e criação para a Meridiano (`/cases/meridiano`). O case segue
  bloqueado, aguardando material e autorização ([ficha](../cases/meridiano.md), CON-07).

## Para a Benjamin aprovar (SERV-04)

- [ ] Nome, resumo e descrição de estratégia e gestão de redes
- [ ] Exemplos de entregas (Calendário editorial, Posts e vídeos curtos, Relatórios de desempenho)
- [ ] Área: Social Media
- [ ] Destaque na Home (hoje: sim)
- [ ] Case relacionado: Social media e criação para a Meridiano

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
