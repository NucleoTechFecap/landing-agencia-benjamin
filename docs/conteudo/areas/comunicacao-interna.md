# Área: Comunicação Interna

| Campo | Valor |
| ----- | ----- |
| Task | SOB-07 (#140) |
| Situação | **Provisório** — aguardando o texto aprovado pela Benjamin (CON-04) |
| No site | `/areas#comunicacao-interna` — seção 3 da página de áreas |
| No painel | **Áreas de atuação** → Comunicação Interna |

## Campos no painel

| Campo | Texto atual (provisório) | Regra para publicar |
| ----- | ------------------------ | ------------------- |
| Nome | Comunicação Interna | 2 a 120 caracteres |
| Endereço (slug) | `comunicacao-interna` | Fixo depois da primeira publicação |
| Resumo | Comunicação interna, clima, engajamento e alinhamento do time. | 10 a 200 caracteres (atual: 62) |
| Descrição | Cuida de como as pessoas de uma organização se informam e se conectam, fortalecendo clima, engajamento e alinhamento. | Mínimo de 20 caracteres (atual: 117) |
| Destaques | Campanhas internas · Clima e engajamento · Alinhamento de times | Até 12, um por linha |
| Ícone | Comentário (`comentario`) | Um dos 14 ícones oficiais |
| Ordem | 3 | Menor aparece primeiro |

## Relações

- **Serviços desta área** (vínculo feito no cadastro do serviço): [Comunicação Interna](../servicos/comunicacao-interna.md).

## Para a Benjamin aprovar (SOB-07)

- [ ] Nome da área e posição na página (3ª de 6)
- [ ] Resumo e descrição: comunicação, clima, engajamento e alinhamento
- [ ] Destaques (Campanhas internas, Clima e engajamento, Alinhamento de times)
- [ ] Ícone **Comentário**
- [ ] Serviço que nasce da área: Comunicação Interna

## Depois da aprovação

1. A Benjamin devolve esta ficha com os itens marcados (ou o texto final ao lado de cada campo).
2. A equipe cadastra ou atualiza o item no painel com o texto aprovado e publica.
3. Em `content/` (site sem banco, desenvolvimento), o item deixa de ser `provisional` e o teste
   de conformidade correspondente (`content/itens-do-mvp.test.ts`) passa a exigir isso.
