# Provisionamento do ambiente de produção

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | GO-02 (#192)                                                             |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`) · backup: Vinícius Binda (`@VinnizzZ`) |
| Versão       | 1.0.0                                                                    |
| Data         | 13/10/2026                                                               |
| Depende de   | ARC-06 (ambientes), DB-02 (migrations de conteúdo), decisão de plano/conta (ADR-0002) |
| Arquivos     | `vercel.json` (região `gru1` — São Paulo), `app/api/internal/jobs/notificacoes` |

## 1. Pré-requisitos (decisões)

- [ ] Conta/plano institucional da **Vercel** para produção (uso comercial; crons frequentes exigem plano pago).
- [ ] Organização/plano do **Supabase** para produção (sem pausa por inatividade; backups diários).
- [ ] Conta **Resend** com domínio do remetente verificado (depende do domínio — GO-03).
- [ ] Quem tem acesso de produção (ARC-06 §3) — nominal.

## 2. Supabase (`benjamin-prd`)

1. Criar o projeto na região **South America (São Paulo)** — `sa-east-1`, mesma região da Vercel (`gru1`).
2. Senha do banco gerada e guardada no cofre da equipe (nunca em chat/issue).
3. Aplicar as migrations já validadas em homologação:
   ```bash
   supabase link --project-ref <ref-prd>
   supabase db push
   ```
4. Conferir: `profiles`, `role_permissions` (148 linhas), `audit_log`, `form_submissions`, bucket `media` e as tabelas de conteúdo (DB-02) com RLS **habilitada** (`select relname, relrowsecurity from pg_class …`).
5. Auth: desligar cadastro público, senha mínima 12, Site URL/Redirect URLs de produção, templates de convite/recuperação (ADM-02 §3), SMTP do domínio (GO-03).
6. Backups: confirmar política diária e testar restauração em projeto descartável (DB-10).
7. Seed autorizado de produção (GO-04) e convites dos administradores (INT-08).

## 3. Vercel

1. Importar o repositório `NucleoTechFecap/landing-agencia-benjamin` no time do NúcleoTech.
2. **Production Branch:** `production` (Settings → Git). `main` gera deployments de homologação.
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
| Vercel (Member) | Vinícius Nishimura Reis, Vinícius Binda |
| Supabase (Owner/Admin) | Conta institucional; Vinícius Nishimura Reis, Vinícius Binda |
| Resend | Vinícius Nishimura Reis, Vinícius Binda |
| Painel `/admin` | `super_admin` NúcleoTech + contas indicadas pela Benjamin (INT-08) |

## 5. Verificação de isolamento (critério de aceite)

- [ ] URL, projeto Supabase, chaves e destinatários de produção diferentes de homologação.
- [ ] Dados de homologação não existem em produção (seed fictício nunca aplicado em `benjamin-prd`).
- [ ] Deploy de produção funcional: `GET /api/v1/health` = 200 e smoke test de GO-01 §5.
- [ ] `GET /api/internal/jobs/notificacoes` sem token = 401; com token = 200.
- [ ] `robots.txt` indexável apenas em produção.

**Situação:** arquivos e roteiro prontos; o provisionamento depende da decisão de conta/plano
(ADR-0002) e das migrations de conteúdo (DB-02).
