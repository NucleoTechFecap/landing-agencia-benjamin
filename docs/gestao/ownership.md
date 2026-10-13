# Distribuição técnica das frentes e ownership

| Campo        | Valor                                                              |
| ------------ | ------------------------------------------------------------------ |
| Issue        | GOV-07 (#7)                                                        |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                           |
| Versão       | 1.0.0 — **proposta para consenso da equipe**                       |
| Data         | 13/10/2026                                                         |
| Fonte        | `Agencia_Benjamin_Backlog_Redistribuido.csv` (211 tarefas) + capacidade informada por integrante |

## 1. Princípios

1. **Uma pessoa responsável por issue** (dono), mesmo quando várias pessoas colaboram.
2. **Backup nomeado por frente crítica**: assume a issue se o dono ficar indisponível por mais de
   2 dias úteis ou se a issue P0 ficar bloqueada.
3. Revisor ≠ autor em PRs críticos (TECH-13).
4. Sugestão do backlog só vira responsabilidade após **aceite explícito** do integrante (comentário
   "aceito" na issue ou registro na reunião de checkpoint — GOV-08).

## 2. Frentes, donos e backups

| Frente | Dono | Backup | Revisão técnica | Crítica? |
| ------ | ---- | ------ | --------------- | -------- |
| Gestão, escopo e comunicação com a Benjamin | Flávio Santos | Vinícius Nishimura Reis | — | Sim |
| Arquitetura, ambientes e regras de negócio (ARC, TECH) | Vinícius Nishimura Reis | Vinícius Binda | Vinícius Binda | Sim |
| Autenticação, permissões e auditoria (ADM-01…03, TECH-03, TECH-10) | Vinícius Nishimura Reis | Vinícius Binda | Vinícius Binda | Sim |
| Banco de dados, migrations e APIs (DB, DBX) | Vinícius Binda (`@VinnizzZ`) | Murilo Vasconcellos | Vinícius Nishimura Reis | Sim |
| Design e UX/UI (UX) | Vinícius Cardoso de Lima | Caio Moraes | Flávio Santos | Não |
| Estrutura do site, Home e design system no código (LAY, HOME) | Caio Moraes (`@caiomorhaes`) | Julia Damasio | Vinícius Nishimura Reis | Não |
| Sobre, áreas e serviços (SOB, SERV) | Caio Moraes / Murilo Vasconcellos | Julia Damasio | — | Não |
| Cases e portfólio (CASE) | Julia Damasio (`@Juliadamassio`) | Murilo Vasconcellos | — | Não |
| Painel/CMS (ADM-04…18) | Murilo Vasconcellos (`@murilovasconcellos`) | Caio Moraes | Vinícius Nishimura Reis | Sim |
| Formulários, leads e feedback (FORM) | Gustavo Duarte Güering | Vinícius Nishimura Reis | Vinícius Binda | Sim |
| Segurança, LGPD e acessibilidade (SEG) | Rafael Morais Rocha | Vinícius Nishimura Reis | Vinícius Nishimura Reis | Sim |
| Testes e homologação (QA) | Rafael Morais Rocha | Julia Damasio | — | Sim |
| Deploy e entrega (GO) | Vinícius Nishimura Reis | Vinícius Binda | Flávio Santos | Sim |
| Conteúdo e insumos (CON) | Agência Benjamin (Melissa Namie / Renan Hida) | Julia Damasio (consolidação) | — | Sim (bloqueia publicação) |

## 3. Carga por integrante (backlog completo)

| Integrante | GitHub | Tarefas | Situação |
| ---------- | ------ | ------- | -------- |
| Vinícius Nishimura Reis | `Vinishireis` | 42 | Atribuídas |
| Caio Moraes | `caiomorhaes` | 27 | Atribuídas |
| Julia Damasio | `Juliadamassio` | 24 | Atribuídas |
| Murilo Ribeiro Vasconcellos | `murilovasconcellos` | 24 | Atribuídas |
| Vinícius Binda | `VinnizzZ` | 12 | Atribuídas |
| Gustavo Duarte Güering | — | 19 | **Sem usuário GitHub / convite pendente** |
| Rafael Morais Rocha | — | 17 | **Sem usuário GitHub / convite pendente** |
| Vinícius Cardoso de Lima | — | 17 | **Sem usuário GitHub informado** |
| Flávio Santos | — | 16 | **Sem usuário GitHub informado** |
| Agência Benjamin | — | 13 | Externo — acompanhamento por Flávio |

**69 issues** (33%) não têm responsável atribuível no GitHub hoje. A lista completa, com dono e
backup por issue, está em [`ownership-por-issue.csv`](ownership-por-issue.csv).

## 4. Riscos de concentração

| Risco | Mitigação proposta |
| ----- | ------------------ |
| 42 tarefas (35 críticas) concentradas na coordenação técnica | Tarefas de definição (TECH) entregues em S1; implementação de formulários e QA migram para os donos das frentes após o aceite |
| Formulários (P0) dependem de integrante sem acesso ao GitHub | Vinícius Nishimura Reis assume como backup até o convite ser aceito (GOV-06) |
| Design sem usuário GitHub | Entregas de UX acontecem no Figma; Caio Moraes registra as validações nas issues UX |
| Conteúdo depende da Benjamin | Conteúdo provisório versionado e selo "Conteúdo provisório" (CON-13) |

## 5. Próximos passos para concluir a GOV-07

- [ ] Apresentar esta matriz no checkpoint semanal (GOV-08) e registrar o aceite de cada integrante.
- [ ] Obter os usuários GitHub de Gustavo, Rafael, Vinícius Cardoso e Flávio e aceitar convites (GOV-06).
- [ ] Atribuir as 69 issues pendentes conforme `ownership-por-issue.csv`.
- [ ] Atualizar este documento para versão 1.1.0 com o status "Confirmado".
