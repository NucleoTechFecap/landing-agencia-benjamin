# Provisionamento do ambiente de produção

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | GO-02 (#192)                                                             |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`) · backup: Vinicius Binda (`@VinnizzZ`) |
| Versão       | 1.1.0 — decisão de contas e estado em 27/10/2026                         |
| Data         | 13/10/2026 · atualizado em 27/10 e 02/11/2026                            |
| Depende de   | ARC-06 (ambientes), DB-02 (migrations de conteúdo), decisão de plano/conta (ADR-0002) |
| Arquivos     | `vercel.json` (região `gru1` — São Paulo), `app/api/internal/jobs/notificacoes` |

## 1. Pré-requisitos (decisões)

- [x] Conta/plano institucional da **Vercel** para produção (uso comercial; crons frequentes exigem plano pago).
      **Decisão de 27/10/2026:** contas institucionais do NúcleoTech, não contas pessoais (o plano
      Hobby da Vercel não permite uso comercial).
- [x] Organização/plano do **Supabase** para produção.
      **Decisão de 27/10/2026:** organização institucional do NúcleoTech. **Decisão de 04/11/2026:** plano Free por
      enquanto, então há pausa por inatividade e nenhum backup do Supabase
      ([backup e recuperação](backup-e-recuperacao.md)).
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
5. Marcar o banco como produção (ARC-11). O `supabase/seed.sql` de desenvolvimento recusa rodar
   em banco marcado, mesmo que alguém use `db push --include-seed` ou cole o arquivo no SQL Editor.
   Depende da migration `20261102000100` (passo 3). No SQL Editor, uma vez por projeto:
   ```sql
   insert into public.ambiente_banco (ambiente) values ('producao');
   select ambiente from public.ambiente_banco;  -- producao
   ```
   A primeira versão usava `alter database ... set app.ambiente`, que não funciona no Supabase:
   o papel `postgres` não é superusuário e o comando falha com `42501`.
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
- [ ] `select ambiente from public.ambiente_banco` em produção retorna `producao` (trava do seed, ARC-11).
- [ ] Deploy de produção funcional: `GET /api/v1/health` = 200 e smoke test de GO-01 §5.
- [ ] `GET /api/internal/jobs/notificacoes` sem token = 401; com token = 200.
- [ ] `robots.txt` indexável apenas em produção.

## 6. Estado em 02/11/2026

| Item | Situação |
| ---- | -------- |
| Decisão de conta e plano | ✅ Contas institucionais do NúcleoTech (Vercel e Supabase). Supabase no plano Free, sem backup gerenciado |
| Backup | 🟡 Procedimento e restauração validados localmente; primeira cópia real pendente ([DB-10](backup-e-recuperacao.md)) |
| Projeto na Vercel | 🟡 Existe (`agencia-benjamin`) e publica a cada merge. Ver a divergência abaixo |
| Projeto no Supabase | 🟡 Existe na organização NucleoTech FECAP. Ver a divergência abaixo. O conteúdo do banco **não foi inspecionado** |
| Migrations de conteúdo (DB-02) e da TECH-13 (#301, #312) | ✅ Na `main` |
| Migrations pendentes | ⏳ `20261102000300` (#365) e `20261102000200` (#366), aguardando revisão. Não aplicadas em ambiente remoto |
| Aplicação | ✅ Next.js 16.4.5 na `main` desde 04/11 (#378), com o release de segurança de 03/11. `vercel.json` em `gru1` |
| Acesso às contas na máquina de quem provisiona | ⏳ Em 02/11, a Vercel CLI estava na conta pessoal e a Supabase CLI não via o projeto |
| Remetente dos formulários (`NOTIFICATION_FROM`) | ⏳ Depende de um domínio verificado no Resend ([GO-03 §0](dominio-dns-https.md#0-decisão-de-27102026-publicar-em-vercelapp-até-o-domínio-sair)) |
| Destinatários (`*_NOTIFICATION_TO`) | ⏳ No pedido de aprovação preparado para a Benjamin (CON-10) |

### Divergências entre o que está no ar e esta documentação

Precisam de decisão de quem responde pela produção antes de qualquer `db push` ou publicação.

| Tema | Documentado | Observado em 02/11/2026 | Por que importa |
| ---- | ----------- | ----------------------- | --------------- |
| Fluxo de publicação | `main` = homologação; produção só por PR `main → production` (GO-01, ARC-06) | A branch `production` não existe, e a Vercel marca os deploys da `main` como **Production** | Todo merge vai ao ar em `agencia-benjamin.vercel.app`, sem o passo de aprovação de release |
| Modo do site | Produção indexável | Esse endereço responde `noindex` e `robots.txt` com `Disallow: /`, e ainda mostra "Conteúdo provisório" | Funciona hoje como homologação pública, apesar do nome Production |
| Região do banco | `sa-east-1`, junto da Vercel em `gru1` (§2) | O projeto está em `us-east-1` | Cada consulta atravessa São Paulo–Virgínia, e a região não muda depois de criada: corrigir exige projeto novo. Vale também confirmar o que o aviso de privacidade diz sobre o local dos dados |
| Separação de ambientes | Um projeto por ambiente (`benjamin-dev`, `-hml`, `-prd`; ARC-06 §4) | A organização tem um único projeto, "Agência Benjamin" | Homologação e produção não ficam isoladas, que é o critério de aceite da GO-02 |

**Decisões pedidas:**

1. Esse projeto Supabase é a produção, a homologação ou será substituído por projetos em `sa-east-1`?
   **Conferido de fora em 04/11/2026: o deploy público não usa banco nenhum.** A CSP publicada não traz a origem do
   Supabase, e os formulários respondem "serviço indisponível" ([go/no-go §6.1](go-no-go.md)). Para o site funcionar,
   faltam `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel, com as
   migrations aplicadas antes (GO-04, Vinícius Binda).
2. A Production Branch da Vercel passa para `production`, ou a documentação muda para o fluxo que
   está em uso?

Com isso decidido, a ordem é: homologação pelo mesmo roteiro → QA em homologação → produção (§2 e §3)
→ verificação de isolamento (§5).
