# Ambientes e variáveis

## Ambientes

| Ambiente | Código | Para quê | Supabase | Indexação |
| --- | --- | --- | --- | --- |
| Local | Branch local | Desenvolvimento (`npm run dev`) | CLI local com seed, ou `benjamin-dev` | — |
| Preview | Branch do PR | Revisar cada pull request | `benjamin-dev` | `noindex` |
| Homologação | `main` | Validação da equipe e da Benjamin | `benjamin-hml` | `noindex` |
| Produção | `production` | Site público da Agência Benjamin | `benjamin-prd`, isolado | Indexável |

A hospedagem é o projeto `agencia-benjamin` do time do NúcleoTech na Vercel. Antes de qualquer
operação, confira no painel da Vercel (Settings → Git) qual branch está configurada como
Production: a matriz acima é o processo combinado, e a configuração do provedor precisa
acompanhá-la.

## Variáveis

| Variável | Escopo | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | público | Endereço canônico (canonical, Open Graph, sitemap) |
| `NEXT_PUBLIC_SITE_ENV` | público | `development` · `preview` · `homologation` · `production`. Fora de `production` o site envia `noindex` |
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | Projeto Supabase do ambiente |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | Ignora a RLS: só no servidor e em scripts operacionais |
| `SUBMISSION_HASH_SECRET` | servidor | HMAC dos envios de formulário |
| `NOTIFY_PROVIDER` · `RESEND_API_KEY` · `NOTIFICATION_FROM` | servidor | E-mail das notificações. O remetente precisa de domínio verificado no Resend |
| `LEAD_` · `CONTACT_` · `FEEDBACK_NOTIFICATION_TO` | servidor | Quem recebe cada tipo de envio |
| `CONTENT_REVALIDATE_SECRET` · `CRON_SECRET` | servidor | Rotas internas de revalidação e jobs |
| `LOG_LEVEL` | servidor | `debug` · `info` · `warn` · `error` |

Em homologação e produção, `SUBMISSION_HASH_SECRET`, `NOTIFY_PROVIDER=resend`, `RESEND_API_KEY`,
`NOTIFICATION_FROM` e ao menos um destinatário são **obrigatórios**: sem eles, o envio de formulário
falha.

`NEXT_PUBLIC_*` vai para o navegador e nunca pode conter segredo. Matriz por ambiente e regras de
rotação: [`docs/ambientes/variaveis-de-ambiente.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/ambientes/variaveis-de-ambiente.md) ·
[matriz de ambientes](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/ambientes/matriz-de-ambientes.md).

## Vazamento de chave

Revogue a chave no provedor, atualize a variável no ambiente certo, publique um novo deploy e
confirme o funcionamento. Nunca cole a chave comprometida num chamado, issue ou conversa.
