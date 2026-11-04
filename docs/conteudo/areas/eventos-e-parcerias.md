# Área: Eventos e Parcerias

| Campo | Valor |
| ----- | ----- |
| Task | SOB-05 (#138) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-04) |
| No site | `/areas#eventos-e-parcerias` — seção 1 da página de áreas |
| No painel | **Áreas de atuação** → Eventos e Parcerias |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Eventos e Parcerias | 2 a 120 caracteres |
| Endereço (slug) | `eventos-e-parcerias` | Fixo depois da primeira publicação |
| Resumo | Planejamento e produção de eventos e prospecção de conexões estratégicas. | 10 a 200 caracteres (atual: 73) |
| Descrição | Concebe, organiza e produz eventos que aproximam marcas e públicos, além de buscar parcerias que ampliam o alcance dos projetos da agência. | Mínimo de 20 caracteres (atual: 139) |
| Destaques | Planejamento de eventos · Produção e operação · Prospecção de parcerias | Até 12, um por linha |
| Ícone | Calendário (`calendario`) | Um dos 14 ícones oficiais |
| Ordem | 1 | Menor aparece primeiro |

## Relações

- **Serviços desta área** (vínculo feito no cadastro do serviço): Eventos.

## Para a Benjamin aprovar (SOB-05)

- [ ] Nome da área e posição na página (1ª de 6)
- [ ] Resumo e descrição: eventos, produção e parcerias, mantendo a relação institucional com a FECAP
- [ ] Destaques (Planejamento de eventos, Produção e operação, Prospecção de parcerias)
- [ ] Ícone **Calendário**
- [ ] Serviço que nasce da área: Eventos. Não existe serviço próprio de parcerias: confirmar se fica assim

O aceite da task pede texto revisado ou placeholder autorizado de forma explícita. Nenhum dos dois
existe ainda: o texto acima é provisório, e o go-live segue bloqueado por ele (GO-01).

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
