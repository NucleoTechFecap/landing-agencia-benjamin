# Checklist de release e plano de rollback

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | GO-01 (#191)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`) · backup: Vinícius Binda (`@VinnizzZ`) |
| Versão       | 1.0.0                                                                   |
| Data         | 13/10/2026                                                              |
| Depende de   | [GOV-13 — critérios de aceite](../gestao/criterios-de-aceite.md), [ARC-06 — ambientes](../ambientes/matriz-de-ambientes.md) |
| Status       | Aprovado pela coordenação técnica                                       |

## 1. Modelo de release

- **Versão:** SemVer com tag anotada `vX.Y.Z` na `main` (MVP = `v1.0.0`).
- **Fluxo:** `main` (homologação) → PR `main → production` aprovado → deploy de produção na Vercel.
- **Janela:** dias úteis, entre 10h e 16h, com responsável e backup disponíveis por 2 h após o deploy.
- **Congelamento:** 24 h antes do go-live do MVP só entram correções aprovadas no go/no-go (TECH-14).

## 2. Papéis no dia do release

| Papel | Pessoa | Responsabilidade |
| ----- | ------ | ---------------- |
| Condutor | Vinícius Nishimura Reis | Executa o checklist, decide rollback |
| Backup técnico | Vinícius Binda | Banco/migrations, assume se o condutor ficar indisponível |
| QA | Rafael Morais Rocha | Smoke test pós-deploy (QA-11) |
| Comunicação | Flávio Santos | Avisa a Benjamin (Melissa/Renan) do início, fim e incidentes |

## 3. Checklist pré-release

### Código e testes
- [ ] PRs do escopo mesclados na `main` com revisão (TECH-13 para críticos).
- [ ] `npm run release:check` verde no commit a publicar (cabeçalhos, tipos, lint, testes, build, **sem conteúdo provisório**).
- [ ] `npm run test:e2e` verde contra homologação (`E2E_BASE_URL=<hml>`).
- [ ] Changelog no PR `main → production` (o que muda, issues, riscos).

### Banco e dados
- [ ] Migrations novas aplicadas e validadas em homologação; lista das que irão para produção.
- [ ] Cada migration tem **reversão** escrita (SQL de rollback no PR) ou é puramente aditiva.
- [ ] Backup de produção recente (< 24 h) e restauração testada no ciclo (DB-10).
- [ ] Seed de produção somente autorizado (GO-04).

### Ambiente
- [ ] Variáveis de produção conferidas na Vercel (ARC-05): `NEXT_PUBLIC_SITE_ENV=production`, `NEXT_PUBLIC_SITE_URL` com o domínio oficial, Supabase, Resend, destinatários, segredos ≥ 32 caracteres.
- [ ] Supabase Auth de produção: cadastro público desligado, redirect URLs, templates de e-mail (ADM-02 §3).
- [ ] Domínio e HTTPS (GO-03) — quando aplicável.

### Aprovações
- [ ] Go/no-go técnico assinado (TECH-14).
- [ ] Aceite institucional da Benjamin para o escopo (GO-07) — no MVP.

## 4. Execução

1. Criar a tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z" && git push origin vX.Y.Z`.
2. Aplicar migrations em produção: `supabase link --project-ref <prd> && supabase db push` (condutor + backup acompanhando).
3. Mesclar o PR `main → production` → deploy automático de produção na Vercel.
4. Anotar o ID do deployment **anterior** (para rollback) e o novo.
5. Rodar o smoke test (seção 5) e comunicar o resultado.

## 5. Smoke test pós-deploy (≤ 15 min)

| # | Verificação | Esperado |
| - | ----------- | -------- |
| 1 | `GET /api/v1/health` | 200 `{"status":"ok"}` |
| 2 | Home, Sobre, Áreas, Serviços, um serviço, Cases, um case, Contato, Feedback | 200, sem erro visual, mobile e desktop |
| 3 | `/cases/inexistente` | 404 |
| 4 | Envio de lead de teste (marcado "TESTE GO-LIVE") | Protocolo exibido, e-mail recebido pelos destinatários, registro no banco (apagar depois) |
| 5 | Login no painel com conta `admin` e logout | OK |
| 6 | `/robots.txt` e `/sitemap.xml` | Indexável, domínio oficial |
| 7 | Logs da Vercel (15 min) | Nenhum `level=error` novo |

## 6. Critérios para rollback

Fazer rollback **imediatamente** se qualquer um ocorrer e não houver correção segura em até 30 min:

- Página pública principal fora do ar ou com erro para todos.
- Formulários não persistem envios (risco de perder leads).
- Exposição de dados pessoais ou de rascunhos.
- Painel inacessível para `admin` sem alternativa.
- Taxa de erro de servidor anormal nos logs.

## 7. Plano de rollback

| Camada | Ação | Tempo-alvo |
| ------ | ---- | ---------- |
| Aplicação | Vercel → Deployments → deployment anterior → **Instant Rollback / Promote to Production** | ≤ 5 min |
| Cache | `POST /api/internal/revalidate` com `{"entity":"settings"}` e demais entidades, se necessário | ≤ 5 min |
| Banco (migration aditiva) | Manter a migration (código anterior ignora colunas novas) | — |
| Banco (migration não aditiva) | Executar o SQL de reversão do PR; se houver perda, restaurar backup (DB-10) em janela combinada | ≤ 60 min |
| Configuração | Restaurar variáveis anteriores na Vercel (histórico) e redeploy | ≤ 10 min |
| Domínio | Reverter registros DNS para o valor anterior (GO-03) | Conforme TTL |

Depois do rollback: comunicar a Benjamin, abrir issue `[INCIDENTE]` com linha do tempo, causa,
impacto (sem dados pessoais) e ação corretiva; nova tentativa só com novo go/no-go.

## 8. Comunicação

| Momento | Canal | Mensagem |
| ------- | ----- | -------- |
| Início | Grupo NúcleoTech + Benjamin | "Publicação vX.Y.Z iniciada; previsão de término HH:MM." |
| Fim | Mesmo | "vX.Y.Z publicada e verificada." + resumo |
| Incidente/rollback | Mesmo + issue | O que aconteceu, impacto, situação atual e próximo passo |
