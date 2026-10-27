# Serviço: Design e Identidade Visual

| Campo | Valor |
| ----- | ----- |
| Task | SERV-08 (#151) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-05) |
| No site | `/servicos/design-e-identidade-visual` · em destaque na Home |
| No painel | **Serviços** → Design e Identidade Visual |
| Contato | O botão "Quero este serviço" leva a `/contato?servico=design-e-identidade-visual`, com o serviço pré-selecionado |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Design e Identidade Visual | 2 a 120 caracteres |
| Endereço (slug) | `design-e-identidade-visual` | Fixo depois da primeira publicação |
| Resumo | Identidade, peças gráficas e direção de arte. | 10 a 200 caracteres (atual: 45) |
| Descrição | Criação e evolução de identidades visuais, peças para meios digitais e impressos e direção de arte de campanhas. | Mínimo de 20 caracteres (atual: 112) |
| Exemplos de entregas | Identidade visual · Peças digitais e impressas · Direção de arte | Até 12, um por linha |
| Áreas de atuação | [Criação](../areas/criacao.md) | Ao menos uma publicada |
| Ícone | Raio (`raio`) | Um dos 14 ícones oficiais |
| Imagem | Nenhuma (o site usa o ícone) | Da biblioteca de mídia, com texto alternativo |
| Destaque na Home | Sim | Até 6 serviços em destaque |
| Ordem | 6 | Menor aparece primeiro |

## Relações

- **Cases relacionados:** Social media e criação para a Meridiano (`/cases/meridiano`).

## Para a Benjamin aprovar (SERV-08)

- [ ] Nome, resumo e descrição
- [ ] Exemplos de entregas (Identidade visual, Peças digitais e impressas, Direção de arte)
- [ ] Área: Criação
- [ ] **Imagem autorizada** do serviço: uma peça do portfólio com autorização do cliente (ou da
      própria Benjamin), em JPG/PNG/WebP até 5 MB e 2400 px de largura, com texto alternativo

Até chegar a imagem autorizada, o serviço aparece com o ícone oficial (sem foto), o que já atende
o site; a imagem é enviada pela biblioteca de mídia do painel (ADM-08) e escolhida no serviço.

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
