# Handoff técnico e manutenção

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | GO-09 (#199)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Versão       | 1.2.0 — revisada em 02/11/2026; nova revisão após a publicação (GO-06)  |
| Data         | 13/10/2026 · revisão 27/10/2026 · revisão 02/11/2026                    |
| Depende de   | [ARC-12](../arquitetura/documentacao-tecnica.md), GO-06                 |
| Público      | Quem assume a manutenção técnica no NúcleoTech                          |

## 1. Resumo do sistema

| Item | Onde ler |
| ---- | -------- |
| Stack e decisões | [ADR-0002](../adr/0002-stack-de-desenvolvimento.md) e [índice de ADRs](../adr/README.md) |
| Arquitetura, rotas e banco | [Documentação técnica](../arquitetura/documentacao-tecnica.md) |
| Como rodar localmente | [README](../../README.md) |
| Convenções de contribuição | [CONTRIBUTING](../../CONTRIBUTING.md) |
| Variáveis de ambiente | [Catálogo](../ambientes/variaveis-de-ambiente.md) e `.env.example` |
| Ambientes e acessos | [Matriz de ambientes](../ambientes/matriz-de-ambientes.md) |
| Deploy, release e rollback | [GO-01](release-e-rollback.md), [GO-02](provisionamento-producao.md), [GO-03](dominio-dns-https.md) |

## 2. Contatos

| Assunto | Pessoa | Canal |
| ------- | ------ | ----- |
| Coordenação do projeto | Flávio Santos | Canal do NúcleoTech |
| Coordenação técnica | Vinícius Nishimura Reis (`@Vinishireis`) | GitHub / canal do NúcleoTech |
| Banco e backups | Vinícius Binda (`@VinnizzZ`) | GitHub / canal do NúcleoTech |
| Conteúdo e aprovações da agência | Melissa Namie, Renan Hida (Agência Benjamin) | Canal combinado em GOV-04 |
| Domínio | Agência Benjamin (CON-11) | — |

## 3. Operações rotineiras

| Operação | Frequência | Como |
| -------- | ---------- | ---- |
| Atualizar textos, serviços, cases e mídia | Quando necessário | Pela própria Benjamin no painel (GO-08) |
| Convidar/desligar usuários do painel | Sob demanda | [Administrador inicial](administrador-inicial.md); desligamento no mesmo dia |
| Conferir notificações com falha | Semanal | `select … from form_submissions where notification_status = 'failed'`; job de reenvio (GO-02). Com `notification_attempts = 5` não há novo reenvio automático: corrija a causa e devolva à fila com `update form_submissions set notification_attempts = 0 where id = …` |
| Retenção de dados pessoais | Mensal | Rotina de DBX-05 com `planRetention` (TECH-08) |
| Revisar logs de erro | Semanal | Vercel → Logs filtrando `level=error` (ADR-0004) |
| Revisar contas ativas e papéis | Mensal | `profiles` + trilha `user.*` na auditoria |
| Atualizar dependências | Mensal | `npm outdated`, `npm audit`, PR com `npm run verify`, `test:e2e`, `test:supabase` e `test:e2e:cms` |
| Atualizar Next.js | A cada minor | Ler `node_modules/next/dist/docs/` da nova versão (AGENTS.md) |
| Rotacionar segredos | Semestral e ao desligar alguém com acesso | [ARC-05 §4](../ambientes/variaveis-de-ambiente.md) |
| Copiar banco e arquivos para o Drive institucional | Semanal | [DB-10 §4](backup-e-recuperacao.md): é o único backup no plano Free. Conferir também o uso e se há aviso de pausa |
| Testar restauração de backup | Trimestral | `npm run test:restore` ([DB-10 §6](backup-e-recuperacao.md)) |
| Invalidar cache manualmente | Em incidente | `POST /api/internal/revalidate` (ADR-0006) |

As rotinas com frequência fixa já são issues no Project 4, com a label `manutencao`: #302 a #309
(MANUT-01 a MANUT-08). Cada execução é registrada num comentário da issue correspondente.

## 4. Tarefas de manutenção visíveis à equipe

As rotinas recorrentes da seção 3 estão nas issues #302 a #309 (label `manutencao`, uma por
rotina, com checklist e responsável). Começam a valer com a publicação (GO-06).

Pendências conhecidas em 02/11/2026:

- **Produção (GO-02):** decidir o papel do único projeto Supabase e o fluxo da Vercel, que hoje publica
  a `main` como Production ([provisionamento §6](provisionamento-producao.md)). O domínio oficial
  (GO-03) segue pendente, com publicação em `*.vercel.app` até ele existir.
- **Release de segurança do Next.js em 03/11/2026:** atualizar assim que sair, antes de publicar.
- **PRs abertos:** #365 (TECH-06), #366 (gravação atômica, #314), #367 (envio direto de mídia, #313)
  e #368 (dependências). As migrations `20261102000300` e `20261102000200` não foram aplicadas em
  nenhum ambiente remoto.
- **Achados baixos da revisão técnica de 02/11:** #369.
- **PRs críticos sem revisão registrada:** ver [revisão de PRs §6.3](../qualidade/revisao-de-prs.md).
- **Evoluções planejadas**, todas fora do MVP e à espera de aprovação: CRM
  ([FUT-01](../roadmap/evolucao-crm.md)), histórico de versões
  ([FUT-04](../roadmap/historico-de-versoes.md)), integrações
  ([FUT-07](../roadmap/integracoes-externas.md)) e módulos internos
  ([FUT-08](../roadmap/modulos-internos.md)).

Resolvidas: o site lê o conteúdo publicado no Supabase (DB-03/04/05, INT-02, INT-03), e
`publishedSlugExists` consulta a fonte ativa; o #301 foi mesclado; os rulesets da `main` e da
`production` estão ativos desde 28/10. `npm audit --omit=dev` não acusa vulnerabilidades. Com as
dependências de desenvolvimento, há 17 moderadas de um único aviso (`minimatch`, via ESLint 9), que só
corrige com o ESLint 10.

## 5. Reprodutibilidade (verificada em 02/11/2026)

A partir de um checkout limpo da `main` (`7be685f`), com o Node 22 do `.nvmrc`. As linhas marcadas
rodaram no PR #368, que é a mesma `main` com o Next.js 16.4.4 e o Vitest 5.1.0:

| Passo | Resultado |
| ----- | --------- |
| `npm ci` e `npm run verify` (cabeçalhos, formatação, tipos, lint, testes e build) | 763 testes (57 ignorados por exigirem o Supabase); build com 68 páginas |
| `npx supabase start`, `npx supabase db reset` e `npx supabase test db` (no #368) | 154 testes pgTAP |
| `npm run test:supabase` (RLS, Storage e visibilidade pública; no #368) | 56/56 |
| `npm run test:e2e` (jornadas do site com o conteúdo versionado; no #368) | 96 passaram, 42 ignorados |
| `npm run test:e2e:cms` (jornadas do editor contra o Supabase local; no #368) | 18/18 |

`tests/integration/supabase/slugs-e-urls.test.ts` ("excluído, os endereços ficam reservados") é
instável: depende da ordenação do sufixo aleatório e falha em parte das execuções, sem relação com o
código testado.

## 6. Checklist de handoff (concluir após GO-06)

- [ ] Acessos de produção transferidos/confirmados (Vercel, Supabase, Resend, domínio) — nominais.
- [ ] Segredos guardados no cofre institucional; ninguém com cópia pessoal.
- [ ] Sessão de passagem de conhecimento (1 h) gravada ou com ata.
- [x] Issues de manutenção recorrente criadas no Project (#302 a #309).
- [ ] Este documento revisado com a versão publicada (`v1.0.0`) e datas reais.
