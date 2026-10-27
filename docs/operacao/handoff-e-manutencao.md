# Handoff técnico e manutenção

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | GO-09 (#199)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Versão       | 1.1.0 — revisada após a entrega do CMS; nova revisão após a publicação (GO-06) |
| Data         | 13/10/2026 · revisão 27/10/2026                                         |
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
| Conferir notificações com falha | Semanal | `select … from form_submissions where notification_status = 'failed'`; job de reenvio (GO-02) |
| Retenção de dados pessoais | Mensal | Rotina de DBX-05 com `planRetention` (TECH-08) |
| Revisar logs de erro | Semanal | Vercel → Logs filtrando `level=error` (ADR-0004) |
| Revisar contas ativas e papéis | Mensal | `profiles` + trilha `user.*` na auditoria |
| Atualizar dependências | Mensal | `npm outdated`, `npm audit`, PR com `npm run verify`, `test:e2e`, `test:supabase` e `test:e2e:cms` |
| Atualizar Next.js | A cada minor | Ler `node_modules/next/dist/docs/` da nova versão (AGENTS.md) |
| Rotacionar segredos | Semestral e ao desligar alguém com acesso | [ARC-05 §4](../ambientes/variaveis-de-ambiente.md) |
| Testar restauração de backup | Trimestral | DB-10 |
| Invalidar cache manualmente | Em incidente | `POST /api/internal/revalidate` (ADR-0006) |

As rotinas com frequência fixa já são issues no Project 4, com a label `manutencao`: #302 a #309
(MANUT-01 a MANUT-08). Cada execução é registrada num comentário da issue correspondente.

## 4. Tarefas de manutenção visíveis à equipe

As rotinas recorrentes da seção 3 estão nas issues #302 a #309 (label `manutencao`, uma por
rotina, com checklist e responsável). Começam a valer com a publicação (GO-06).

Pendências conhecidas em 27/10/2026:

- Produção (GO-02) nas contas institucionais da Vercel e do Supabase, publicando no endereço
  `*.vercel.app` até o domínio oficial (GO-03) existir.
- Merge do #301 (exclusão de conta com eventos auditados), depois da revisão de quem responde pelo
  banco.
- Ativar o ruleset da `main` (CONTRIBUTING §6) e "Require review from Code Owners". Hoje a `main`
  não tem proteção.
- Evoluções planejadas, todas fora do MVP e à espera de aprovação: CRM
  ([FUT-01](../roadmap/evolucao-crm.md)), histórico de versões
  ([FUT-04](../roadmap/historico-de-versoes.md)), integrações
  ([FUT-07](../roadmap/integracoes-externas.md)) e módulos internos
  ([FUT-08](../roadmap/modulos-internos.md)).

Resolvidas na entrega do CMS (27/10/2026): o site lê o conteúdo publicado no Supabase
(DB-03/04/05, INT-02), e `publishedSlugExists` consulta a fonte ativa. Com o Next.js 16.4.3 (#300),
`npm audit` não acusa mais vulnerabilidades, nem nas dependências de desenvolvimento.

## 5. Reprodutibilidade (verificada em 27/10/2026)

A partir de um checkout limpo da `main`, com o Node 22 do `.nvmrc`:

| Passo | Resultado |
| ----- | --------- |
| `npm ci` e `npm run verify` (cabeçalhos, formatação, tipos, lint, testes e build) | 625 testes; build com 63 páginas |
| `npx supabase start`, `npx supabase db reset` e `npx supabase test db` | 93 testes pgTAP (com o #301) |
| `npm run test:supabase` (RLS, Storage e visibilidade pública) | 40/40 |
| `npm run test:e2e` (jornadas do site com o conteúdo versionado) | 8/8 |
| `npm run test:e2e:cms` (jornada do editor contra o Supabase local) | 2/2 |

## 6. Checklist de handoff (concluir após GO-06)

- [ ] Acessos de produção transferidos/confirmados (Vercel, Supabase, Resend, domínio) — nominais.
- [ ] Segredos guardados no cofre institucional; ninguém com cópia pessoal.
- [ ] Sessão de passagem de conhecimento (1 h) gravada ou com ata.
- [x] Issues de manutenção recorrente criadas no Project (#302 a #309).
- [ ] Este documento revisado com a versão publicada (`v1.0.0`) e datas reais.
