# Decisão técnica de go/no-go do MVP

| Campo           | Valor                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Issue           | TECH-14 (#178)                                                          |
| Responsável     | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Revisão técnica | Flávio Santos                                                           |
| Versão          | 1.2.0 (modelo + registros de 13/10, 27/10 e 02/11)                      |
| Data            | 13/10/2026 · atualizado em 27/10 e 02/11/2026 · decisão prevista para 03–04/11/2026 |
| Depende de      | QA-11 (smoke pós-correções), [GO-01](release-e-rollback.md)             |

> A decisão técnica **não substitui** o aceite institucional da Agência Benjamin (GO-07), que segue
> separado.

## 1. Regra de decisão

- **GO:** todos os itens **bloqueantes (B)** atendidos; riscos residuais registrados e aceitos.
- **GO com ressalvas:** só itens **não bloqueantes (N)** pendentes, com dono e prazo.
- **NO-GO:** qualquer item B pendente → nova avaliação após correção (mínimo 24 h antes da publicação).

## 2. Checklist de evidências

Situação em **02/11/2026**, no commit `7be685f` da `main` (✅ atendido · 🟡 parcial · ⏳ pendente ·
❌ falhando). A situação de 27/10 está no registro do §5.

| # | Evidência | Tipo | Fonte | Situação em 02/11 |
| - | --------- | ---- | ----- | ----------------- |
| E1 | Homologação aprovada pela Benjamin sem bugs bloqueantes abertos | B | QA-09, QA-10 | ⏳ Homologação ainda não existe (GO-02) |
| E2 | Smoke test pós-correções sem falhas | B | QA-11 | ⏳ Depende da homologação |
| E3 | Critérios de aceite técnicos (CA-xx `T`) atendidos | B | [GOV-13](../gestao/criterios-de-aceite.md) | 🟡 CMS coberto localmente (QA-04, CT-01 a CT-16); conferência de todos os CA-xx pendente |
| E4 | `npm run release:check` verde no commit candidato (inclui **sem conteúdo provisório**) | B | GO-01 | ❌ `verify` verde; `check:release-content` falha com **20 itens provisórios publicados** (6 áreas, 9 serviços, 3 cases, manifesto e Sobre), que dependem do texto aprovado (CON-05) e dos materiais dos cases (CON-08) |
| E5 | `npm run test:e2e` verde contra homologação | B | TECH-12 | 🟡 Local, com o PR #368: `test:e2e` 96 passaram e 42 ignorados; `test:e2e:cms` 18/18. Contra homologação ⏳ |
| E6 | Vulnerabilidades: `npm audit --omit=dev` sem altas/críticas; testes de acesso indevido (QA-06) sem falhas | B | Auditoria + QA-06 | ❌ `npm audit --omit=dev`: 0, mas o **release de segurança do Next.js de 03/11/2026 (7 vulnerabilidades médias) precisa entrar antes de publicar**. Com desenvolvimento: 17 moderadas, todas do aviso `GHSA-g3hv-75wg-m249` (`minimatch`, via ESLint 9; não entra em produção). Revisão técnica de 02/11 sem achado alto ou médio. QA-06 ⏳ |
| E7 | Integridade do conteúdo: `findIntegrityIssues` sem erros; serviços oficiais e cases liberados publicados | B | INT-04, INT-05, TECH-05 | 🟡 Sem erros de integridade no conteúdo versionado (testes de conformidade); versões oficiais ainda não publicadas |
| E8 | Operações administrativas: login, edição, publicação, arquivamento e permissões verificadas | B | QA-04, ADM-02/03 | 🟡 Local: matriz de publicação, 16 casos do QA-04 e `test:e2e:cms` 18/18; em homologação ⏳ |
| E9 | Formulários entregam ao destinatário institucional; duplicidade e falhas tratadas | B | QA-05, FORM-10, TECH-07 | ⏳ Destinatários reais (CON-10) e remetente verificado no Resend sem resposta; correções da TECH-06 no PR #365, aguardando revisão |
| E10 | Backup configurado e restauração testada | B | DB-10 | 🟡 Plano Free, sem backup do Supabase. Cópia semanal definida e restauração validada em stack local (04/11). **Falta a primeira cópia real da produção** e definir onde fica a senha da cópia ([§8](backup-e-recuperacao.md)) |
| E11 | Domínio com HTTPS válido | B* | GO-03 | 🟡 Decisão de 27/10: publicar na URL `*.vercel.app` (HTTPS da Vercel) até o domínio sair. Atende com ressalva |
| E12 | Plano de rollback revisado e deployment anterior identificado | B | GO-01 | 🟡 Plano revisado, mas descreve `main → production`. A Vercel hoje publica a `main` como Production, sem a branch `production` (ver riscos) |
| E13 | Aviso de privacidade validado institucionalmente | B | SEG-02, SEG-10 | ⏳ Aviso publicado ainda como minuta em validação |
| E14 | SEO/acessibilidade/desempenho (Lighthouse ≥ 90 mobile) | N | QA-07, SEG-08 | ⏳ Não medido nesta data |
| E15 | Documentação de uso do CMS entregue | N | GO-08 | ✅ [Guia do painel](../cms/guia-do-painel.md) para as telas existentes (áreas, serviços, categorias, cases e mídia) |

## 3. Riscos residuais (registro)

| Risco | Probabilidade | Impacto | Tratamento | Dono |
| ----- | ------------- | ------- | ---------- | ---- |
| ~~Vulnerabilidades altas em dependências de desenvolvimento (`eslint-config-next`)~~ | — | — | **Resolvido em 27/10** com `eslint-config-next` 16.4.3 (#300): `npm audit` sem vulnerabilidades | — |
| Conteúdo depende da Benjamin: 20 itens ainda provisórios | Alta | Alto (bloqueia E4) | Pedido de aprovação preparado em 27/10; publicar só o que for liberado (CA-11 condicionado) | Julia Damasio / Flávio Santos |
| Produção ainda não provisionada | Média | Alto | Decidido em 27/10: contas institucionais da Vercel e do Supabase; aguardando o acesso para o GO-02 | Coordenação técnica |
| Sem domínio oficial na data | Alta | Médio (marca, SEO) | Publicar em `*.vercel.app` e migrar quando o domínio sair (GO-03) | Agência Benjamin / coordenação técnica |
| ~~`main` sem proteção~~ | — | — | **Resolvido em 28/10** com os rulesets de `main` e `production`. PRs anteriores sem revisão registrada: ver [revisão de PRs §6.3](../qualidade/revisao-de-prs.md) | — |
| Release de segurança do Next.js em 03/11 (7 médias) ainda não aplicado | Alta | Alto (bloqueia E6) | Atualizar assim que sair, repetindo a bateria do PR #368, antes de qualquer publicação | Coordenação técnica |
| Vercel publica a `main` como Production; a branch `production` não existe | Alta | Alto | Cada merge vai ao ar em `agencia-benjamin.vercel.app` (hoje com `noindex`). Contradiz GO-01 e ARC-06. Decidir o fluxo antes do GO ([provisionamento §6](provisionamento-producao.md)) | Coordenação técnica |
| Projeto Supabase único, em `us-east-1`, e a documentação prevê `sa-east-1` e projetos separados | Alta | Médio | A região não muda depois de criada. Decidir o papel do projeto antes de aplicar migrations ([provisionamento §6](provisionamento-producao.md)) | Coordenação técnica |
| Gravação do CMS não é atômica (item, vínculos e galeria) | Baixa | Médio | Falha registrada e explicada (#316); transação no PR #366, aguardando revisão | Coordenação técnica |
| Envio de mídia pelo painel limitado a 4 MB (teto da Vercel) | Média | Baixo | Mensagem antes do envio (#316); envio direto ao Storage no PR #367, aguardando revisão | Coordenação técnica |
| Sem histórico de versões no MVP | Baixa | Médio | Arquivar antes de excluir + auditoria + cópia semanal (ADR-0007); proposta em FUT-04 | Coordenação técnica |
| Plano Free do Supabase: sem backup gerenciado e com pausa por inatividade | Média | Alto | Decisão de 04/11: perda aceita de até 7 dias, recuperação em até 120 min, cópia semanal no Drive institucional ([DB-10](backup-e-recuperacao.md)); reavaliar o Pro antes de dados reais em volume | Vinícius Binda |

## 4. Registro preliminar — 13/10/2026 (fim da fundação técnica)

| Item | Resultado |
| ---- | --------- |
| Testes unitários/integrados | 213 passando (1 suíte de gate pulada por padrão) |
| E2E local (build de produção, desktop + mobile) | 8/8 passando |
| `npm audit --omit=dev` (produção) | **0 vulnerabilidades** |
| `npm audit` (inclui dev) | 5 altas, todas transitivas de `eslint-config-next` (ver riscos) |
| Gate de conteúdo provisório | **Falha (esperado)** — textos e cases ainda provisórios |
| Decisão nesta data | **NO-GO** (esperado: MVP em construção; serve de linha de base) |

## 5. Registro intermediário — 27/10/2026 (CMS entregue)

| Item | Resultado |
| ---- | --------- |
| Commit avaliado | `b105cdb` (`main`, depois do #300) |
| `npm run verify` | Verde: 625 testes e build (63 páginas) |
| `npx supabase test db` | 84 testes pgTAP (93 com o #301; 95 com o #312) |
| `npm run test:supabase` (RLS, Storage, visibilidade) | 40/40 |
| `npm run test:e2e` / `npm run test:e2e:cms` | 8/8 / 2/2 |
| `npm audit --omit=dev` / `npm audit` | 0 / 0 vulnerabilidades |
| `npm run check:release-content` | **Falha (esperado)**: 20 itens provisórios publicados |
| Revisão de segurança (TECH-13) | Sem achado alto; 4 médios e 3 baixos com correção ou issue ([registro](../qualidade/revisao-de-prs.md#5-revisão-de-segurança-da-entrega-do-cms-27102026)) |
| Decisão nesta data | **NO-GO**. Bloqueantes pendentes: E1, E2, E4, E9, E10 e E13 |

**Caminho até a decisão de 03–04/11:**

1. Acesso às contas institucionais e provisionamento de homologação e produção (GO-02).
2. Revisão e merge de #301, #312 e #316; ativar o ruleset da `main`.
3. Respostas da Benjamin (aprovações, destinatários e conteúdo final), publicação pelo painel e
   `check:release-content` verde.
4. QA-09/10/11 em homologação, `test:e2e` contra homologação e QA-06.
5. Validação do aviso de privacidade (SEG-02) e backup com restauração testada (DB-10).

## 6. Registro — 02/11/2026 (véspera da decisão)

Este registro é preparação: a decisão continua sendo a da ata do §7, assinada por quem responde por ela.

| Item | Resultado |
| ---- | --------- |
| Commit avaliado | `7be685f` (`main`) |
| `npm run verify` | Verde: 763 testes (57 ignorados por exigirem o Supabase) e build (68 páginas) |
| `npx supabase test db` (com #368) | `Files=6, Tests=154, Result: PASS` |
| `npm run test:supabase` (com #368) | 56/56 |
| `npm run test:e2e` / `npm run test:e2e:cms` (com #368) | 96 passaram e 42 ignorados / 18/18 |
| `npm audit --omit=dev` / `npm audit` | 0 / 17 moderadas, de um único aviso (`minimatch`) |
| `npm run check:release-content` | **Falha**: 20 itens provisórios publicados |
| Revisão técnica (TECH-13) | Sem achado alto ou médio; 8 baixos ([registro](../qualidade/revisao-de-prs.md)) |
| Recomendação nesta data | **NO-GO**. Bloqueantes pendentes: E1, E2, E4, E6, E9, E10 e E13 |

**A data de 04/11 está em risco alto.** E1 e E2 dependem de uma homologação que ainda não existe. E4, E9
e E13 dependem de respostas que estão fora do alcance do NúcleoTech. E6 tem saída prevista para 03/11.

**Caminho até publicar:**

1. Decidir o papel do projeto Supabase e o fluxo da Vercel ([provisionamento §6](provisionamento-producao.md)).
2. Aplicar o release de segurança do Next.js assim que sair.
3. Revisar e mesclar #365, #366, #367 e #368, e aplicar as migrations `20261102000300` e `20261102000200`.
4. Respostas da Benjamin (aprovações, destinatários e conteúdo final), publicação pelo painel e
   `check:release-content` verde.
5. QA-09/10/11 em homologação, `test:e2e` contra homologação e QA-06.
6. Validação do aviso de privacidade (SEG-02) e backup com restauração testada (DB-10).

## 7. Ata da decisão final (preencher em 03–04/11/2026)

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
