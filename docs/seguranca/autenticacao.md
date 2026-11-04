# Autenticação da equipe autorizada

| Campo        | Valor                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| Issue        | ADM-02 (#78), SEG-06 (#100)                                               |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                  |
| Versão       | 1.1.0 — atributos do cookie de sessão (SEG-06)                            |
| Data         | 13/10/2026 · revisão 04/11/2026                                           |
| Depende de   | ARC-02 (Supabase Auth), [ADM-01 — perfis](perfis-e-permissoes.md)         |
| Código       | `proxy.ts`, `lib/server/supabase/server.ts`, `lib/domain/security/http-policy.ts`, `lib/server/auth/session.ts`, `app/admin/**`, `supabase/migrations/20261013000100_auth_profiles.sql` |

## 1. Arquitetura

| Peça | Responsabilidade |
| ---- | ---------------- |
| Supabase Auth | Identidade, senha (hash no provedor), tokens JWT + refresh token, e-mails de convite/recuperação |
| `@supabase/ssr` | Sessão em **cookies httpOnly** (`SameSite=Lax`, `Secure` quando o site é https: [seção 2.1](#21-cookies-da-sessão-seg-06)) — nada em `localStorage` |
| `proxy.ts` (`/admin/:path*`) | Renova os tokens a cada acesso ao painel (renovação de sessão) |
| `getSessionUser()` | Valida o token no servidor de Auth (`getUser`) e lê o papel em `profiles` (memoizado por requisição) |
| `profiles` | Papel (`app_role`) e status ativo; conta nova nasce `pending` (trigger) |
| `app/admin/actions.ts` | `signIn`, `signOut`, `requestPasswordReset`, `updatePassword` |
| `app/admin/auth/callback` | Troca o código/`token_hash` dos e-mails por sessão (convite e recuperação) |

## 2. Fluxos

| Fluxo | Passos | Segurança |
| ----- | ------ | --------- |
| **Login** | `/admin/login` → `signInWithPassword` → papel ≠ `pending` → redireciona para `next` validado | Mensagem genérica ("E-mail ou senha inválidos"); `pending` é deslogado; `safeAdminRedirect` impede *open redirect* |
| **Sessão** | Cookies httpOnly; cada página do painel chama `getSessionUser()` dentro de `<Suspense>` | Papel lido do banco a cada requisição, nunca do cliente |
| **Renovação** | `proxy.ts` chama `getUser()`; tokens expirados são renovados com o refresh token | Refresh token rotativo (configuração do Supabase) |
| **Logout** | `signOut` (Server Action via `<form>`) → remove cookies e revoga a sessão. A tela de login recarrega a página (`?saiu=1` → `?saiu=ok`), para tirar da memória do navegador as telas que o Next mantém escondidas (SEG-04) | Não depende de JavaScript |
| **Recuperação** | `/admin/recuperar-senha` → e-mail com link → `/admin/auth/callback` → `/admin/nova-senha` | Resposta idêntica exista ou não a conta |
| **Convite** (INT-08) | Convite pelo Supabase → link → callback → `/admin/nova-senha` → papel atribuído por quem convidou | Ninguém conhece ou recebe a senha de outra pessoa |

### 2.1 Cookies da sessão (SEG-06)

O padrão de `@supabase/ssr` é `httpOnly: false`, sem `secure`, porque a biblioteca prevê um cliente no
navegador. Até SEG-06 o projeto usava esse padrão, ao contrário do que esta página dizia. Agora
`sessionCookieOptions()` (`lib/domain/security/http-policy.ts`) é a única fonte dos atributos, usada em
`proxy.ts` e em `createSessionClient()`. Vale para todos os cookies `sb-*`, inclusive o verificador do
PKCE gravado ao pedir a recuperação de senha.

| Atributo | Valor | Por quê |
| -------- | ----- | ------- |
| `HttpOnly` | Sempre | Nada lê a sessão no navegador: o projeto não usa `createBrowserClient`, e o envio de mídia usa um token de uso único emitido pelo servidor (`media-upload-form.tsx`, sem `persistSession`) |
| `SameSite` | `Lax` | Os links de convite e recuperação chegam por e-mail, em navegação de nível superior. `Strict` não enviaria o cookie nessa entrada, e quem abrisse o painel por um link cairia no login |
| `Secure` | Em homologação e produção sempre. Fora delas, exceto quando `NEXT_PUBLIC_SITE_URL` começa com `http://` | Ver abaixo |
| `Path` | `/` | Padrão da biblioteca |
| `Max-Age` | 400 dias | Padrão da biblioteca. Ver "Duração da sessão" |

**Por que `Secure` não depende de `NODE_ENV`.** O E2E roda `next start` em `http://localhost`, com
`NODE_ENV=production`. O Chrome aceita `Secure` em localhost, então o teste passaria, mas nem todo
navegador aceita (o Safari recusa), e fora de localhost nenhum aceita: o login falharia sem aviso.
Decidir pela origem declarada falha do lado seguro: um Preview sem `NEXT_PUBLIC_SITE_URL` recebe
`Secure`, e uma origem digitada com `http://` em produção não tira o atributo. Só `next dev` e
`next start` com origem `http://` declarada ficam sem ele.

**Sessões abertas antes de SEG-06.** Nome, formato e conteúdo do cookie não mudaram, então elas
continuam válidas sem novo login. O atributo só chega quando o cookie é regravado, na primeira renovação
de token depois do deploy: no máximo 1 h de uso (JWT expiry de 3600 s). Até lá, o cookie antigo segue
legível por JavaScript. Quem quiser encerrar esse intervalo na hora pode revogar as sessões no Supabase.

**Duração da sessão.** Esta documentação não promete um limite de sessão: promete renovação sem novo
login e encerramento pelo logout. O cookie vale 400 dias a cada renovação, e o `maxAge` não foi alterado
por três motivos:

- `@supabase/ssr` 0.12 ignora `cookieOptions.maxAge` ao gravar a sessão (`maxAge: DEFAULT_COOKIE_OPTIONS.maxAge`
  em `applyServerStorage`). Mudar exigiria reescrever o valor dentro do `setAll`, contra a biblioteca.
- O prazo do cookie só limita aquele navegador. O refresh token não expira por padrão, então um token
  copiado continua valendo depois de o cookie vencer.
- O limite real (`[auth.sessions]`: `timebox` e `inactivity_timeout`) só existe no plano Pro, e a
  produção fica no Free por decisão de 04/11/2026 ([ADR-0002](../adr/0002-stack-de-desenvolvimento.md)).

Hoje a sessão termina por logout, desativação da conta (`profiles.active`, lida a cada requisição) ou
revogação no Supabase. **Decisão pendente da coordenação:** se o painel deve ter limite de inatividade,
o caminho é o plano Pro. Computador compartilhado depende de a pessoa clicar em "Sair".

## 3. Configuração obrigatória no Supabase (por ambiente)

| Configuração | Valor |
| ------------ | ----- |
| Authentication → Sign In / Providers → **Allow new users to sign up** | **Desligado** (somente convite) |
| Email provider | Ligado; "Confirm email" ligado |
| Minimum password length | **12** · Password requirements: letras e dígitos |
| Site URL | `NEXT_PUBLIC_SITE_URL` do ambiente |
| Redirect URLs | `<site>/admin/auth/callback` (dev: `http://localhost:3000/admin/auth/callback`) |
| JWT expiry | 3600 s |
| Refresh token rotation | Ligado, reuse interval 10 s |
| Rate limits (Auth) | Padrões do Supabase (limitam tentativas de login por IP) |
| E-mail templates (convite e recuperação) | Link `{{ .SiteURL }}/admin/auth/callback?token_hash={{ .TokenHash }}&type=invite` (ou `recovery`) `&next=/admin/nova-senha`. HTML e assunto versionados em `supabase/templates/` e no `config.toml` (local); em homologação e produção, copiar em Authentication → Email Templates (INT-08) |
| SMTP | Domínio da Benjamin via Resend quando o domínio existir (GO-03); até lá, SMTP padrão do Supabase |

Migration: `supabase db push` aplica `20261013000100_auth_profiles.sql` (enum de papéis, `profiles`,
trigger de perfil `pending`, `current_app_role()` e RLS de leitura do próprio perfil).

## 4. Testes

| Tipo | Cobertura |
| ---- | --------- |
| Automatizado | `redirect.test.ts` — *open redirect* (8 casos) e política de senha |
| Automatizado | `http-policy.test.ts` (regra de `Secure`), `server.test.ts` e `proxy.test.ts` (atributos gravados, passando pelo `@supabase/ssr` real: login, logout, PKCE e renovação) |
| E2E `@cms` | `tests/e2e/seguranca-cabecalhos.spec.ts`: login, recuperação, convite, callback inválido e logout em `http://localhost`, com `HttpOnly` e `SameSite` conferidos no navegador; sessão antiga sem `HttpOnly` continua válida e ganha os atributos ao renovar |
| Smoke local sem Supabase | `/admin` → 307 para `/admin/login`; callback sem código → `/admin/login?erro=link`; páginas com `noindex, nofollow` |

### Roteiro de verificação em homologação (critério de aceite)

1. Convidar conta de teste (`editor`) pelo Supabase `benjamin-hml`; abrir o e-mail e definir senha em `/admin/nova-senha`.
2. Entrar em `/admin/login` → painel exibe nome e papel.
3. Aguardar > 1 h (ou reduzir JWT expiry para 60 s no hml) e navegar: sessão renovada sem novo login.
4. "Sair" → volta ao login com aviso; voltar com o botão do navegador não reabre o painel.
5. Conta com papel `pending` tenta entrar → mensagem de acesso não liberado.
6. Senha errada 3× → mensagem genérica; e-mail inexistente em "Esqueci minha senha" → mesma mensagem de sucesso.
7. `/admin/login?next=https://evil.com` → após login vai para `/admin`.
8. DevTools → Application → Cookies: todo `sb-*` com `HttpOnly`, `Secure` e `SameSite=Lax`; `document.cookie` no console sem `sb-` (SEG-06).

Registrar evidências (prints e data) na issue ADM-02.
