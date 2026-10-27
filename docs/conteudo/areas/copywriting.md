# Área: Copywriting

| Campo | Valor |
| ----- | ----- |
| Task | SOB-08 (#141) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/areas#copywriting` — seção 4 da página de áreas |
| No painel | **Áreas de atuação** → Copywriting |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Copywriting | 2 a 120 caracteres |
| Endereço (slug) | `copywriting` | Fixo depois da primeira publicação |
| Resumo | Textos estratégicos, narrativas, conteúdos, materiais para blogs e copys. | 10 a 200 caracteres (atual: 73) |
| Descrição | Transforma estratégia em palavras: do texto curto de uma campanha ao artigo de blog, com voz adequada a cada marca. | Mínimo de 20 caracteres (atual: 115) |
| Destaques | Textos estratégicos · Narrativas e conteúdos · Blogs e copys | Até 12, um por linha |
| Ícone | Enviado (`enviado`) | Um dos 14 ícones oficiais |
| Ordem | 4 | Menor aparece primeiro |

## Relações

- **Serviços desta área** (vínculo feito no cadastro do serviço): Estratégia Digital, [Produção de Conteúdo](../servicos/producao-de-conteudo.md), [Copywriting](../servicos/copywriting.md).

## Para a Benjamin aprovar (SOB-08)

- [ ] Nome da área e posição na página (4ª de 6)
- [ ] Resumo e descrição (texto final, sem prometer resultados)
- [ ] Destaques (Textos estratégicos, Narrativas e conteúdos, Blogs e copys)
- [ ] Ícone **Enviado**
- [ ] Serviços que nascem da área: Estratégia Digital, Produção de Conteúdo e Copywriting

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
