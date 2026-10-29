# Serviço: Audiovisual

| Campo | Valor |
| ----- | ----- |
| Task | SERV-09 (#152) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/audiovisual` · em destaque na Home |
| No painel | **Serviços** → Audiovisual |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=audiovisual`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Audiovisual | 2 a 120 caracteres |
| Endereço (slug) | `audiovisual` | Pode mudar depois de publicado; o antigo leva ao novo (301) |
| Resumo | Vídeos, fotos e coberturas para contar histórias. | 10 a 200 caracteres (atual: 49) |
| Descrição | Roteiro, captação e edição de vídeos institucionais, conteúdos para redes e cobertura fotográfica e audiovisual de eventos. | Mínimo de 20 caracteres (atual: 123) |
| Exemplos de entregas | Vídeos institucionais · Vídeos para redes · Cobertura de eventos | Até 12, um por linha |
| Áreas de atuação | [Criação](../areas/criacao.md) | Ao menos uma publicada |
| Ícone | Like (`like`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Sim | Até 6 serviços em destaque |
| Ordem | 7 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** nenhum ainda.

## Para a Benjamin aprovar (SERV-09)

- [ ] Nome, resumo e descrição
- [ ] Exemplos de entregas (Vídeos institucionais, Vídeos para redes, Cobertura de eventos)
- [ ] Área: Criação
- [ ] Materiais: vídeos entram como **link externo** (YouTube, Vimeo, Instagram, TikTok) nos cases
      — o painel não recebe arquivo de vídeo (ADR-0005)

Sem mídia quebrada: o serviço usa o ícone oficial; qualquer imagem escolhida no painel precisa
existir na biblioteca e ter texto alternativo para publicar (R12).

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
