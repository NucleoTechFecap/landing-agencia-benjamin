# Decisão técnica de go/no-go do MVP

| Campo           | Valor                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Issue           | TECH-14 (#178)                                                          |
| Responsável     | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Revisão técnica | Flávio Santos                                                           |
| Versão          | 1.0.0 (modelo + registro preliminar)                                    |
| Data            | 13/10/2026 · decisão prevista para 03–04/11/2026                        |
| Depende de      | QA-11 (smoke pós-correções), [GO-01](release-e-rollback.md)             |

> A decisão técnica **não substitui** o aceite institucional da Agência Benjamin (GO-07), que segue
> separado.

## 1. Regra de decisão

- **GO:** todos os itens **bloqueantes (B)** atendidos; riscos residuais registrados e aceitos.
- **GO com ressalvas:** só itens **não bloqueantes (N)** pendentes, com dono e prazo.
- **NO-GO:** qualquer item B pendente → nova avaliação após correção (mínimo 24 h antes da publicação).

## 2. Checklist de evidências

| # | Evidência | Tipo | Fonte | Situação |
| - | --------- | ---- | ----- | -------- |
| E1 | Homologação aprovada pela Benjamin sem bugs bloqueantes abertos | B | QA-09, QA-10 | ⏳ |
| E2 | Smoke test pós-correções sem falhas | B | QA-11 | ⏳ |
| E3 | Critérios de aceite técnicos (CA-xx `T`) atendidos | B | [GOV-13](../gestao/criterios-de-aceite.md) | ⏳ |
| E4 | `npm run release:check` verde no commit candidato (inclui **sem conteúdo provisório**) | B | GO-01 | ⏳ |
| E5 | `npm run test:e2e` verde contra homologação | B | TECH-12 | ⏳ |
| E6 | Vulnerabilidades: `npm audit --omit=dev` sem altas/críticas; testes de acesso indevido (QA-06) sem falhas | B | Auditoria + QA-06 | ⏳ |
| E7 | Integridade do conteúdo: `findIntegrityIssues` sem erros; serviços oficiais e cases liberados publicados | B | INT-04, INT-05, TECH-05 | ⏳ |
| E8 | Operações administrativas: login, edição, publicação, arquivamento e permissões verificadas | B | QA-04, ADM-02/03 | ⏳ |
| E9 | Formulários entregam ao destinatário institucional; duplicidade e falhas tratadas | B | QA-05, FORM-10, TECH-07 | ⏳ |
| E10 | Backup configurado e restauração testada | B | DB-10 | ⏳ |
| E11 | Domínio com HTTPS válido | B* | GO-03 | ⏳ (*sem domínio: publicar na URL da Vercel com ressalva) |
| E12 | Plano de rollback revisado e deployment anterior identificado | B | GO-01 | ⏳ |
| E13 | Aviso de privacidade validado institucionalmente | B | SEG-02, SEG-10 | ⏳ |
| E14 | SEO/acessibilidade/desempenho (Lighthouse ≥ 90 mobile) | N | QA-07, SEG-08 | ⏳ |
| E15 | Documentação de uso do CMS entregue | N | GO-08 | ⏳ |

## 3. Riscos residuais (registro)

| Risco | Probabilidade | Impacto | Tratamento | Dono |
| ----- | ------------- | ------- | ---------- | ---- |
| Vulnerabilidades altas em dependências **de desenvolvimento** (`eslint-config-next` → `fast-glob`/`micromatch`/`braces`, DoS por padrão glob) | Baixa | Baixo (não vão para o bundle de produção) | Atualizar `eslint-config-next` quando houver patch (ARC-04) | Caio Moraes |
| Conteúdo de cases depende de material da Benjamin | Média | Médio | Publicar só cases liberados (CA-11 condicionado) | Julia Damasio |
| Plano gratuito pausar/limitar produção | Média | Alto | Conta/plano institucional antes do GO-02 | Coordenação |
| Sem histórico de versões no MVP | Baixa | Médio | Arquivar antes de excluir + auditoria + backup (ADR-0007) | Coordenação técnica |

## 4. Registro preliminar — 13/10/2026 (fim da fundação técnica)

| Item | Resultado |
| ---- | --------- |
| Testes unitários/integrados | 213 passando (1 suíte de gate pulada por padrão) |
| E2E local (build de produção, desktop + mobile) | 8/8 passando |
| `npm audit --omit=dev` (produção) | **0 vulnerabilidades** |
| `npm audit` (inclui dev) | 5 altas, todas transitivas de `eslint-config-next` (ver riscos) |
| Gate de conteúdo provisório | **Falha (esperado)** — textos e cases ainda provisórios |
| Decisão nesta data | **NO-GO** (esperado: MVP em construção; serve de linha de base) |

## 5. Ata da decisão final (preencher em 03–04/11/2026)

| Campo | Valor |
| ----- | ----- |
| Data/hora | |
| Commit/tag candidato | |
| Resultado | GO · GO com ressalvas · NO-GO |
| Itens pendentes e donos | |
| Riscos aceitos | |
| Assinatura técnica | Vinícius Nishimura Reis |
| Revisão | Flávio Santos |
| Proposta enviada à coordenação em | |
