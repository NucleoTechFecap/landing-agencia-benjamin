# Provisionamento do ambiente de produção

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | GO-02 (#192)                                                             |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`) · backup: Vinicius Binda (`@VinnizzZ`) |
| Versão       | 1.1.0 — decisão de contas e estado em 27/10/2026                         |
| Data         | 13/10/2026 · atualizado em 27/10/2026                                    |
| Depende de   | ARC-06 (ambientes), DB-02 (migrations de conteúdo), decisão de plano/conta (ADR-0002) |
| Arquivos     | `vercel.json` (região `gru1` — São Paulo), `app/api/internal/jobs/notificacoes` |

## 1. Pré-requisitos (decisões)

- [x] Conta/plano institucional da **Vercel** para produção (uso comercial; crons frequentes exigem plano pago).
      **Decisão de 27/10/2026:** contas institucionais do NúcleoTech, não contas pessoais (o plano
      Hobby da Vercel não permite uso comercial).
- [x] Organização/plano do **Supabase** para produção (sem pausa por inatividade; backups diários).
      **Decisão de 27/10/2026:** organização institucional do NúcleoTech.
- [ ] Acesso às duas contas na máquina de quem provisiona (`vercel login` e `npx supabase login`).
- [ ] Conta **Resend** com domínio do remetente verificado. Sem o domínio da Benjamin, ver a
      pendência do remetente em [GO-03 §0](dominio-dns-https.md#0-decisão-de-27102026-publicar-em-vercelapp-até-o-domínio-sair).
- [ ] Quem tem acesso de produção (ARC-06 §3) — nominal.

## 2. Supabase (`benjamin-prd`)

1. Criar o projeto na região **South America (São Paulo)** — `sa-east-1`, mesma região da Vercel (`gru1`).
2. Senha do banco gerada e guardada no cofre da equipe (nunca em chat/issue).
3. Aplicar as migrations já validadas em homologação. Antes, conferir o merge de #301 (exclusão de
   conta com eventos auditados) e #312 (bucket de mídia sem listagem anônima), que trazem as
   migrations `20261027000100` e `20261027000200`:
   ```bash
   supabase link --project-ref <ref-prd>
   supabase db push
   ```
4. Conferir: `profiles`, `role_permissions` (148 linhas), `audit_log`, `form_submissions`, bucket `media` e as tabelas de conteúdo (DB-02) com RLS **habilitada** (`select relname, relrowsecurity from pg_class …`).
5. Marcar o banco como produção (DBX-02). O `supabase/seed.sql` de desenvolvimento recusa rodar
   em banco marcado, mesmo que alguém use `db push --include-seed` ou cole o arquivo no SQL Editor.
   No SQL Editor, uma vez por projeto:
   ```sql
   alter database postgres set app.ambiente = 'producao';
   -- conferir numa conexão nova (a configuração vale para sessões abertas depois):
   select current_setting('app.ambiente', true);  -- producao
   ```
   Nunca rode `supabase db reset --linked`: ele apaga o banco remoto inteiro antes de chegar ao seed.
6. Auth: desligar cadastro público, senha mínima 12, Site URL/Redirect URLs de produção, templates de convite/recuperação (ADM-02 §3), SMTP do domínio (GO-03).
7. Backups: confirmar política diária e testar restauração em projeto descartável (DB-10).
8. Seed autorizado de produção (GO-04) e convites dos administradores (INT-08).

## 3. Vercel

1. Importar o repositório `NucleoTechFecap/landing-agencia-benjamin` no time do NúcleoTech.
2. **Production Branch:** `production` (Settings → Git). `main` gera deployments de homologação.
   A branch `production` ainda não existe: ela nasce da tag `v1.0.0` no dia da publicação (GO-06,
   T0), para que nada chegue à produção antes do go/no-go.
3. Região de funções: `gru1` (definida em `vercel.json`).
4. Variáveis **Production** (ARC-05), todas distintas de homologação:

   | Variável | Valor |
   | -------- | ----- |
   | `NEXT_PUBLIC_SITE_ENV` | `production` |
   | `NEXT_PUBLIC_SITE_URL` | Domínio oficial (GO-03); até lá, URL `*.vercel.app` de produção |
   | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Projeto `benjamin-prd` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Projeto `benjamin-prd` |
   | `SUBMISSION_HASH_SECRET`, `CONTENT_REVALIDATE_SECRET`, `CRON_SECRET` | `openssl rand -base64 48` (um para cada) |
   | `NOTIFY_PROVIDER` / `RESEND_API_KEY` / `NOTIFICATION_FROM` | `resend` / chave de produção / remetente verificado |
   | `LEAD_NOTIFICATION_TO` / `CONTACT_NOTIFICATION_TO` / `FEEDBACK_NOTIFICATION_TO` | Destinatários da Benjamin (CON-10) |
   | `LOG_LEVEL` | `info` |

5. **Cron** (Settings → Cron Jobs ou `vercel.json` quando o plano permitir): `GET /api/internal/jobs/notificacoes`
   a cada 15 min. A Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente.
6. **Webhook de conteúdo** (opcional, TECH-09): Database Webhook do Supabase nas tabelas de conteúdo
   → `POST https://<domínio>/api/internal/revalidate` com `Authorization: Bearer <CONTENT_REVALIDATE_SECRET>`.
7. Proteção: Deployment Protection desativada para produção; Preview/homologação com proteção da Vercel
   ou `noindex` (já aplicado pelo `X-Robots-Tag`).

## 4. Políticas de acesso

| Recurso | Produção |
| ------- | -------- |
| Vercel (Owner) | Conta institucional NúcleoTech |
| Vercel (Member) | Vinícius Nishimura Reis, Vinicius Binda |
| Supabase (Owner/Admin) | Conta institucional; Vinícius Nishimura Reis, Vinicius Binda |
| Resend | Vinícius Nishimura Reis, Vinicius Binda |
| Painel `/admin` | `super_admin` NúcleoTech + contas indicadas pela Benjamin (INT-08) |

## 5. Verificação de isolamento (critério de aceite)

- [ ] URL, projeto Supabase, chaves e destinatários de produção diferentes de homologação.
- [ ] Dados de homologação não existem em produção (seed fictício nunca aplicado em `benjamin-prd`).
- [ ] `select current_setting('app.ambiente', true)` em produção retorna `producao` (trava do seed, DBX-02).
- [ ] Deploy de produção funcional: `GET /api/v1/health` = 200 e smoke test de GO-01 §5.
- [ ] `GET /api/internal/jobs/notificacoes` sem token = 401; com token = 200.
- [ ] `robots.txt` indexável apenas em produção.

## 6. Estado em 27/10/2026

| Item | Situação |
| ---- | -------- |
| Decisão de conta e plano | ✅ Contas institucionais do NúcleoTech (Vercel e Supabase) |
| Migrations de conteúdo (DB-02) | ✅ Na `main`; validadas em banco recriado do zero (84 testes pgTAP) |
| Migrations da revisão TECH-13 | ⏳ #301 e #312 aguardando revisão do banco |
| Aplicação | ✅ Next.js 16.4.3, `npm audit` sem vulnerabilidades, `vercel.json` em `gru1` |
| Acesso às contas institucionais | ⏳ Falta o login de quem provisiona |
| Remetente dos formulários (`NOTIFICATION_FROM`) | ⏳ Depende de um domínio verificado no Resend ([GO-03 §0](dominio-dns-https.md#0-decisão-de-27102026-publicar-em-vercelapp-até-o-domínio-sair)) |
| Destinatários (`*_NOTIFICATION_TO`) | ⏳ No pedido de aprovação preparado para a Benjamin (CON-10) |

Com o acesso liberado, a ordem é: homologação (`benjamin-hml`) pelo mesmo roteiro → QA em
homologação → produção (§2 e §3) → verificação de isolamento (§5).
