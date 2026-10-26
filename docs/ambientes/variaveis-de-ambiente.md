# Segredos e variáveis de ambiente por estágio

| Campo        | Valor                                                        |
| ------------ | ------------------------------------------------------------ |
| Issue        | ARC-05 (#46)                                                 |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                     |
| Versão       | 1.0.0                                                        |
| Data         | 13/10/2026                                                   |
| Depende de   | ARC-03, [matriz de ambientes](matriz-de-ambientes.md) (ARC-06) |

## 1. Onde ficam os valores

| Estágio | Onde configurar | Quem configura |
| ------- | --------------- | -------------- |
| Desenvolvimento | `.env.local` na máquina do dev (copiado de `.env.example`) | Cada dev |
| Preview por PR | Vercel → Settings → Environment Variables → *Preview* | Coordenação técnica |
| Homologação | Vercel → *Preview* com filtro de branch `main` | Coordenação técnica |
| Produção | Vercel → *Production* | Coordenação técnica + backup (ARC-06) |

`.env*` está no `.gitignore` (exceto `.env.example`). Nenhum segredo trafega por chat, issue ou
PR: compartilhe pelo cofre da equipe ou diretamente no painel da Vercel.

## 2. Catálogo

Legenda: **O** obrigatória · **R** recomendada · **—** não usar · *pública* = embutida no bundle.

| Variável | Escopo | Dev | Preview | Hml | Prd | Descrição |
| -------- | ------ | --- | ------- | --- | --- | --------- |
| `NEXT_PUBLIC_SITE_URL` | pública | R | R | O | O | Origem canônica (canonical, OG, sitemap, `llms.txt`) |
| `NEXT_PUBLIC_SITE_ENV` | pública | `development` | `preview` | `homologation` | `production` | Controla indexação (`noindex` fora de produção) e exigências de validação |
| `NEXT_PUBLIC_SUPABASE_URL` | pública | R | O | O | O | URL do projeto Supabase do ambiente |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | R | O | O | O | Chave anônima (segura com RLS ativa) |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | R | — | O* | O* | Ignora RLS. *Somente scripts operacionais (INT-08) e gravação, no servidor, de envios de formulário já validados (`lib/server/supabase/admin.ts`); nunca em leitura de conteúdo nem no cliente |
| `SUBMISSION_HASH_SECRET` | servidor | R | O | O | O | HMAC de IP/impressão digital de formulários (TECH-07); ≥ 32 caracteres, diferente por ambiente |
| `NOTIFY_PROVIDER` | servidor | `log` | `log` | `resend` | `resend` | Provedor de notificação |
| `RESEND_API_KEY` | servidor | — | — | O | O | Chave da Resend (prefixo `re_`) |
| `NOTIFICATION_FROM` | servidor | — | — | O | O | Remetente verificado no domínio |
| `LEAD_NOTIFICATION_TO` | servidor | — | — | O (equipe) | O (CON-10) | Destinatários de pedidos comerciais |
| `CONTACT_NOTIFICATION_TO` | servidor | — | — | R | R | Destinatários de contato geral (fallback: `LEAD_NOTIFICATION_TO`) |
| `FEEDBACK_NOTIFICATION_TO` | servidor | — | — | R | R | Destinatários de feedback (fallback: `LEAD_NOTIFICATION_TO`) |
| `CONTENT_SOURCE` | servidor | `local` | `supabase` | `supabase` | `supabase` | Fonte do conteúdo público: `local` (content/, provisório) ou `supabase` (tabelas do CMS, só publicados). Ausente = `local`; `supabase` exige as variáveis do Supabase (DB-03) |
| `CONTENT_REVALIDATE_SECRET` | servidor | — | — | R | R | Bearer do `POST /api/internal/revalidate` (TECH-09); ≥ 32 caracteres |
| `CRON_SECRET` | servidor | — | — | R | O | Bearer dos jobs internos (`/api/internal/jobs/*`) chamados pelo Vercel Cron |
| `LOG_LEVEL` | servidor | `debug` | `info` | `info` | `info` | Nível mínimo dos logs (ARC-09) |

## 3. Validação no código

- `lib/config/public-env.ts` — valida as `NEXT_PUBLIC_*` com Zod. Em homologação/produção a falta
  de `NEXT_PUBLIC_SITE_URL` interrompe o build. Expõe `siteUrl`, `siteEnvironment`, `isIndexable`
  e `isSupabaseConfigured`.
- `lib/config/server-env.ts` — `getServerEnv()` valida as variáveis de servidor na primeira
  leitura (com `import "server-only"`, impedindo uso em Client Components). Fora do
  desenvolvimento, exige segredo de formulários, Resend e destinatário de leads.
- Testes: `lib/config/env.test.ts`.

## 4. Rotação e incidentes

1. Suspeita de vazamento → gere nova chave no provedor, atualize na Vercel e faça *redeploy*.
2. Revogue a chave antiga no provedor (Supabase: *Reset service_role*; Resend: *Revoke*).
3. Registre o incidente (data, chave afetada, ação) no canal da coordenação; se houver dados
   pessoais envolvidos, siga o plano de resposta de TECH-08.
4. Rotação preventiva a cada release maior ou saída de integrante com acesso (GO-09).
