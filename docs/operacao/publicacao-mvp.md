# Publicação da primeira versão (MVP)

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | GO-06 (#196)                                                             |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0                                                                    |
| Data-alvo    | 04/11/2026                                                               |
| Depende de   | QA-11, QA-12, GO-03, GO-05, [TECH-14](go-no-go.md) (GO), [GO-01](release-e-rollback.md) |
| Situação     | Roteiro pronto · aguardando dependências                                 |

## 1. Pré-condições (todas obrigatórias)

- [ ] Go/no-go técnico = **GO** (TECH-14) e aceite institucional encaminhado (GO-07).
- [ ] Produção provisionada e isolada (GO-02) com migrations e seed autorizado (GO-04).
- [x] Domínio com HTTPS (GO-03) — ou decisão registrada de publicar na URL da Vercel até o domínio sair.
      Decisão registrada em 27/10/2026 ([GO-03 §0](dominio-dns-https.md#0-decisão-de-27102026-publicar-em-vercelapp-até-o-domínio-sair));
      o remetente dos formulários segue pendente.
- [ ] Conteúdo final revisado (QA-12, CON-14) e `npm run check:release-content` verde.
- [ ] Administradores da Benjamin convidados em produção (INT-08).

## 2. Linha do tempo do dia

| Horário | Etapa | Responsável | Referência |
| ------- | ----- | ----------- | ---------- |
| D-1 | Congelamento; ensaio do checklist em homologação; comunicado à Benjamin | Coordenação técnica + Flávio | GO-01 §1 |
| T-60 min | Conferir backup de produção, variáveis e deployment atual (para rollback) | Coordenação técnica | GO-01 §3 |
| T-30 min | Tag `v1.0.0` na `main`; migrations pendentes em produção | Coordenação técnica + Vinícius Binda | GO-01 §4 |
| T0 | Merge `main → production`; acompanhar o deploy na Vercel | Coordenação técnica | GO-01 §4 |
| T+10 min | Smoke test completo (páginas, formulários, painel, API, robots/sitemap) | Rafael (QA) | GO-01 §5 |
| T+20 min | Validação de formulários e links no domínio (GO-05) | Gustavo | GO-05 |
| T+30 min | Decisão: manter ou rollback (critérios GO-01 §6) | Coordenação técnica | GO-01 §6–7 |
| T+45 min | Comunicado de publicação à Benjamin e ao NúcleoTech | Flávio | GO-01 §8 |
| T+1 dia | Search Console + sitemap; revisão de logs das primeiras 24 h | Coordenação técnica | QA-07 |

## 3. Critério de sucesso (aceite da issue)

- [ ] Site público acessível no endereço oficial, estável por 24 h (sem `level=error` recorrente).
- [ ] CMS acessível para as contas da Benjamin dentro do escopo aceito.
- [ ] Formulários entregando ao destinatário institucional.
- [ ] Nenhum rollback pendente; incidentes (se houver) registrados.
