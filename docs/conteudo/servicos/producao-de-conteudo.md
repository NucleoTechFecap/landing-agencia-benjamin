# Serviço: Produção de Conteúdo

| Campo | Valor |
| ----- | ----- |
| Task | SERV-06 (#149) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/producao-de-conteudo` · em destaque na Home |
| No painel | **Serviços** → Produção de Conteúdo |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=producao-de-conteudo`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Produção de Conteúdo | 2 a 120 caracteres |
| Endereço (slug) | `producao-de-conteudo` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Conteúdos em texto, imagem e vídeo alinhados à estratégia. | 10 a 200 caracteres (atual: 58) |
| Descrição | Pautas, roteiros, textos, imagens e vídeos produzidos para informar, engajar e gerar relacionamento com o público da marca. | Mínimo de 20 caracteres (atual: 123) |
| Exemplos de entregas | Pautas e roteiros · Conteúdo para blog e redes · Séries editoriais | Até 12, um por linha |
| Áreas de atuação | Social Media, [Copywriting](../areas/copywriting.md), [Criação](../areas/criacao.md) | Ao menos uma publicada |
| Ícone | Salvo (`salvo`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Sim | Até 6 serviços em destaque |
| Ordem | 4 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** Conteúdo para o blog Aventura de Construir (`/cases/aventura-de-construir`).

## Para a Benjamin aprovar (SERV-06)

- [ ] Nome, resumo e descrição (sem conteúdo comercial inventado)
- [ ] Exemplos de entregas (Pautas e roteiros, Conteúdo para blog e redes, Séries editoriais)
- [ ] Áreas: Copywriting, Social Media e Criação
- [ ] Destaque na Home (hoje: sim)
- [ ] Case relacionado: Conteúdo para o blog Aventura de Construir

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
