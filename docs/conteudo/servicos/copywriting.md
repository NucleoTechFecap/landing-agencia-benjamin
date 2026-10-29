# Serviço: Copywriting

| Campo | Valor |
| ----- | ----- |
| Task | SERV-07 (#150) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/copywriting` |
| No painel | **Serviços** → Copywriting |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=copywriting`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Copywriting | 2 a 120 caracteres |
| Endereço (slug) | `copywriting` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Textos que vendem a ideia certa, do jeito certo. | 10 a 200 caracteres (atual: 48) |
| Descrição | Criação de textos estratégicos, narrativas de marca, copys para campanhas e artigos, com tom de voz definido para cada cliente. | Mínimo de 20 caracteres (atual: 127) |
| Exemplos de entregas | Copys de campanha · Artigos para blog · Narrativa e tom de voz | Até 12, um por linha |
| Áreas de atuação | [Copywriting](../areas/copywriting.md) | Ao menos uma publicada |
| Ícone | Enviado (`enviado`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Não | Até 6 serviços em destaque |
| Ordem | 5 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** Conteúdo para o blog Aventura de Construir (`/cases/aventura-de-construir`).

## Para a Benjamin aprovar (SERV-07)

- [ ] Nome, resumo e **descrição revisada**
- [ ] Exemplos de entregas (Copys de campanha, Artigos para blog, Narrativa e tom de voz)
- [ ] Área: Copywriting
- [ ] Case relacionado: Conteúdo para o blog Aventura de Construir

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
