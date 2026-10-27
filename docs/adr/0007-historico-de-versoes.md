# ADR-0007 — Histórico de versões do conteúdo (avaliação para o MVP)

| Campo        | Valor                                                             |
| ------------ | ----------------------------------------------------------------- |
| Issue        | ADM-17 (#93)                                                      |
| Status       | **Aceita** — fora do MVP; segue para FUT-04                       |
| Data         | 13/10/2026                                                        |
| Decisor      | Vinícius Nishimura Reis (`@Vinishireis`)                          |
| Origem       | ATA §4.6 ("será avaliada a implementação de histórico de versões"); PRJ §24 |
| Depende de   | ADM-12 — [fluxo de publicação](../negocio/fluxo-de-publicacao.md) |

## Contexto

A ata pede para **avaliar** um histórico que permita identificar versões anteriores, restaurar e
evitar perda acidental. O MVP tem 3 semanas, várias entidades (páginas, áreas, serviços, cases,
categorias, CTAs, configurações) e o histórico não é critério de aceite da primeira entrega
(PRJ §45).

## Opções avaliadas

| Opção | O que entrega | Custo estimado | Riscos |
| ----- | ------------- | -------------- | ------ |
| A. Snapshot JSON por publicação (tabela `content_versions` genérica: entidade, id, versão, conteúdo, autor) + tela de histórico com restaurar | Restaurar qualquer versão publicada | **24–32 h** (migration + trigger/serviço + diff simples + UI de histórico e restauração + testes) | Restaurar case/serviço com relações (N:M, mídia já excluída) exige regras extras; volume de dados |
| B. Versão só do rascunho anterior (1 nível de "desfazer") | Desfazer a última edição | 10–12 h | Cobertura limitada; confunde com estados de publicação |
| C. **Sem histórico no MVP** + mitigação | Auditoria de quem mudou o quê, arquivamento em vez de exclusão, validação antes de publicar | 0 h adicionais (já entregue em TECH-04/TECH-05/TECH-10) | Conteúdo sobrescrito não é recuperável pela interface (somente por backup) |

## Decisão

**Opção C no MVP**, com histórico completo (opção A) planejado em **FUT-04** após o lançamento.

### Por que não cabe no MVP

- A estimativa da opção A (24–32 h) concorre com P0 do CMS (ADM-05 a ADM-11) e com o prazo de 04/11.
- Restauração segura depende do modelo final das tabelas (DB-01/DB-02), ainda em definição.
- Os riscos que o histórico mitiga já têm cobertura parcial no MVP:

| Risco | Mitigação no MVP |
| ----- | ---------------- |
| Publicar algo errado | Validação obrigatória ao publicar e ao editar publicado (TECH-04); aviso "alteração será publicada imediatamente" |
| Apagar sem querer | Exclusão só depois de arquivar e só por `admin` (TECH-04/TECH-03) |
| Não saber quem alterou | Trilha de auditoria (`content.updated`, `content.published`… — TECH-10) |
| Perda total | Backup diário do banco e da mídia (DB-10), restauração assistida pelo NúcleoTech |

### Preparação para FUT-04 (sem custo agora)

- Campos `updated_at`/`updated_by` em todas as entidades (fluxo de publicação, ADM-12).
- Eventos de auditoria com `resource_id` e `slug` permitem reconstruir a linha do tempo.
- Proposta de tabela para FUT-04: `content_versions (entity, entity_id, version, snapshot jsonb, created_by, created_at, note)` imutável, gravada no `publish` e restaurada como **novo rascunho** (nunca sobrescreve o publicado diretamente), seguindo o modelo do FECAP Cases citado na ata.

## Consequências

- ADM-17 concluída com decisão registrada; FUT-04 recebe a especificação acima como ponto de partida.
- **27/10/2026:** a especificação da FUT-04 ([`historico-de-versoes.md`](../roadmap/historico-de-versoes.md))
  revisa duas premissas acima com o CMS já construído: a versão é gravada a cada gravação, não só ao
  publicar, porque editar um item publicado já o publica; e usar uma versão preenche o formulário
  em vez de criar um rascunho separado, porque cada item é uma linha só.
- A Benjamin deve ser informada no checkpoint (GOV-08): no MVP, recuperar conteúdo sobrescrito
  exige pedido ao NúcleoTech (restauração via backup).
