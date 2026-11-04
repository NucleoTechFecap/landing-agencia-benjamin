# Área: Social Media

| Campo | Valor |
| ----- | ----- |
| Task | SOB-06 (#139) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-04) |
| No site | `/areas#social-media` — seção 2 da página de áreas |
| No painel | **Áreas de atuação** → Social Media |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Social Media | 2 a 120 caracteres |
| Endereço (slug) | `social-media` | Fixo depois da primeira publicação |
| Resumo | Estratégia e gestão multicanal, com foco em Instagram, TikTok e LinkedIn. | 10 a 200 caracteres (atual: 73) |
| Descrição | Planeja, produz e acompanha a presença das marcas nas redes sociais, adaptando linguagem e formato a cada canal. | Mínimo de 20 caracteres (atual: 112) |
| Destaques | Instagram · TikTok · LinkedIn | Até 12, um por linha |
| Ícone | Coração (`coracao`) | Um dos 14 ícones oficiais |
| Ordem | 2 | Menor aparece primeiro |

## Relações

- **Serviços desta área** (vínculo feito no cadastro do serviço): [Estratégia Digital](../servicos/estrategia-digital.md), [Social Media](../servicos/social-media.md), [Produção de Conteúdo](../servicos/producao-de-conteudo.md).

## Para a Benjamin aprovar (SOB-06)

- [ ] Nome da área e posição na página (2ª de 6)
- [ ] Resumo e descrição, sem promessa de resultado que não tenha sido aprovada
- [ ] Destaques: os canais Instagram, TikTok e LinkedIn
- [ ] Ícone **Coração**
- [ ] Serviços que nascem da área: Estratégia Digital, Social Media e Produção de Conteúdo

A área cita os canais pelo nome, em texto, e não leva aos perfis. Os endereços das redes oficiais
ficam nas configurações do site, conferidas à parte (CA-05).

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
