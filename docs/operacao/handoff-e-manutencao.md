# Handoff técnico e manutenção

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | GO-09 (#199)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Versão       | 1.0.0 — será revisada após a publicação (GO-06)                         |
| Data         | 13/10/2026                                                              |
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
| Atualizar dependências | Mensal | `npm outdated`, `npm audit`, PR com `npm run verify` e `test:e2e` |
| Atualizar Next.js | A cada minor | Ler `node_modules/next/dist/docs/` da nova versão (AGENTS.md) |
| Rotacionar segredos | Semestral e ao desligar alguém com acesso | [ARC-05 §4](../ambientes/variaveis-de-ambiente.md) |
| Testar restauração de backup | Trimestral | DB-10 |
| Invalidar cache manualmente | Em incidente | `POST /api/internal/revalidate` (ADR-0006) |

## 4. Tarefas de manutenção visíveis à equipe

Criar no GitHub Project, com label `manutencao`, as recorrências da seção 3 (uma issue por
rotina, com checklist e responsável) logo após a publicação. Pendências conhecidas no momento do
handoff:

- Trocar a fonte do repositório público do seed para o Supabase (DB-03/04/05) e `publishedSlugExists`.
- Atualizar `eslint-config-next` quando houver correção das vulnerabilidades de desenvolvimento (TECH-14 §3).
- Ativar o ruleset da `main` (CONTRIBUTING §6) e "Require review from Code Owners".
- Evoluções planejadas: histórico de versões (FUT-04), CRM (FUT-01), integrações (FUT-07).

## 5. Checklist de handoff (concluir após GO-06)

- [ ] Acessos de produção transferidos/confirmados (Vercel, Supabase, Resend, domínio) — nominais.
- [ ] Segredos guardados no cofre institucional; ninguém com cópia pessoal.
- [ ] Sessão de passagem de conhecimento (1 h) gravada ou com ata.
- [ ] Issues de manutenção recorrente criadas no Project.
- [ ] Este documento revisado com a versão publicada (`v1.0.0`) e datas reais.
