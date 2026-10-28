# Distribuição técnica das frentes e ownership

| Campo        | Valor                                                              |
| ------------ | ------------------------------------------------------------------ |
| Issue        | GOV-07 (#7)                                                        |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                           |
| Versão       | 1.0.1 — **proposta para consenso da equipe** (situação de 27/10/2026) |
| Data         | 13/10/2026 · atualização 27/10/2026                                |
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
| Gustavo Duarte Güering | `gueringg` (a confirmar) | 19 | **Convite enviado, ainda não aceito** (27/10) |
| Rafael Morais Rocha | `rm-rafael` | 17 | Já é colaborador do repositório; **atribuir após o aceite** |
| Vinícius Cardoso de Lima | — | 17 | **Sem usuário GitHub informado** |
| Flávio Santos | — | 16 | **Sem usuário GitHub informado** |
| Agência Benjamin | — | 13 | Externo — acompanhamento por Flávio |
| David de Oliveira Lemes | `dolemes` | 0 | Colaborador do repositório, **sem frente na matriz** — definir no checkpoint |

Em 13/10, **69 issues** (33%) não tinham responsável atribuível no GitHub. Em 27/10 são **83 issues
abertas sem responsável**, listadas com dono sugerido, login e backup em
[`atribuicoes-pendentes.csv`](atribuicoes-pendentes.csv):

| Dono sugerido | Issues | O que falta |
| ------------- | -----: | ----------- |
| Gustavo Duarte Güering | 19 | Aceitar o convite (`gueringg`) e o aceite da frente |
| Rafael Morais Rocha | 17 | Aceite da frente (`rm-rafael` já é colaborador) |
| Flávio Santos | 16 | Usuário GitHub |
| Vinícius Cardoso de Lima | 15 | Usuário GitHub |
| Agência Benjamin | 13 | Externo: acompanhadas por Flávio Santos |
| Murilo Vasconcellos / Caio Moraes | 3 | ADM-13, ADM-16 e ADM-18 nunca foram atribuídas; a ADM-13 parece coberta pelo CMS já entregue |

A proposta original, com dono e backup de todas as 211 tarefas, continua em
[`ownership-por-issue.csv`](ownership-por-issue.csv).

## 4. Riscos de concentração

| Risco | Mitigação proposta |
| ----- | ------------------ |
| 42 tarefas (35 críticas) concentradas na coordenação técnica | Tarefas de definição (TECH) entregues em S1; implementação de formulários e QA migram para os donos das frentes após o aceite |
| Formulários (P0) dependem de integrante sem acesso ao GitHub | Vinícius Nishimura Reis assume como backup até o convite ser aceito (GOV-06) |
| Design sem usuário GitHub | Entregas de UX acontecem no Figma; Caio Moraes registra as validações nas issues UX |
| Conteúdo depende da Benjamin | Conteúdo provisório versionado e selo "Conteúdo provisório" (CON-13) |

## 5. Próximos passos para concluir a GOV-07

- [ ] Apresentar esta matriz no checkpoint semanal (GOV-08) e registrar o aceite de cada integrante.
- [ ] Usuários GitHub (GOV-06): ~~Rafael~~ (`rm-rafael`); Gustavo aceitar o convite (`gueringg`);
      Vinícius Cardoso e Flávio informarem o usuário; definir a frente de David (`dolemes`).
- [ ] Atribuir as issues de [`atribuicoes-pendentes.csv`](atribuicoes-pendentes.csv) de quem deu o
      aceite (comando abaixo).
- [ ] Atualizar este documento para versão 1.1.0 com o status "Confirmado".

Depois do aceite, para atribuir as issues de uma pessoa (exemplo com o Rafael):

```bash
awk -F, '$5 == "rm-rafael" {print $1}' docs/gestao/atribuicoes-pendentes.csv |
  xargs -I{} gh issue edit {} --add-assignee rm-rafael
```
