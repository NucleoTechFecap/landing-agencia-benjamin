# Autenticação da equipe autorizada

| Campo        | Valor                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| Issue        | ADM-02 (#78)                                                              |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                  |
| Versão       | 1.0.0                                                                     |
| Data         | 13/10/2026                                                                |
| Depende de   | ARC-02 (Supabase Auth), [ADM-01 — perfis](perfis-e-permissoes.md)         |
| Código       | `proxy.ts`, `lib/server/supabase/server.ts`, `lib/server/auth/session.ts`, `app/admin/**`, `supabase/migrations/20261013000100_auth_profiles.sql` |

## 1. Arquitetura

| Peça | Responsabilidade |
| ---- | ---------------- |
| Supabase Auth | Identidade, senha (hash no provedor), tokens JWT + refresh token, e-mails de convite/recuperação |
| `@supabase/ssr` | Sessão em **cookies httpOnly** (`Secure` em produção, `SameSite=Lax`) — nada em `localStorage` |
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
| **Logout** | `signOut` (Server Action via `<form>`) → remove cookies e revoga a sessão | Não depende de JavaScript |
| **Recuperação** | `/admin/recuperar-senha` → e-mail com link → `/admin/auth/callback` → `/admin/nova-senha` | Resposta idêntica exista ou não a conta |
| **Convite** (INT-08) | Convite pelo Supabase → link → callback → `/admin/nova-senha` → papel atribuído por quem convidou | Ninguém conhece ou recebe a senha de outra pessoa |

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
| Smoke local sem Supabase | `/admin` → 307 para `/admin/login`; callback sem código → `/admin/login?erro=link`; páginas com `noindex, nofollow` |

### Roteiro de verificação em homologação (critério de aceite)

1. Convidar conta de teste (`editor`) pelo Supabase `benjamin-hml`; abrir o e-mail e definir senha em `/admin/nova-senha`.
2. Entrar em `/admin/login` → painel exibe nome e papel.
3. Aguardar > 1 h (ou reduzir JWT expiry para 60 s no hml) e navegar: sessão renovada sem novo login.
4. "Sair" → volta ao login com aviso; voltar com o botão do navegador não reabre o painel.
5. Conta com papel `pending` tenta entrar → mensagem de acesso não liberado.
6. Senha errada 3× → mensagem genérica; e-mail inexistente em "Esqueci minha senha" → mesma mensagem de sucesso.
7. `/admin/login?next=https://evil.com` → após login vai para `/admin`.

Registrar evidências (prints e data) na issue ADM-02.
