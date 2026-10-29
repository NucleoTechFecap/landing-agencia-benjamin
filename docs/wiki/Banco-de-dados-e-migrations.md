# Banco de dados e migrations

O backend usa **Supabase (PostgreSQL)**, com Row Level Security em todas as tabelas.

## Onde fica cada coisa

| Caminho | Conteúdo |
| --- | --- |
| `supabase/migrations/` | Schema em ordem temporal: perfis, RBAC, auditoria, formulários, conteúdo do CMS e ajustes posteriores |
| `supabase/rollbacks/` | Um `.down.sql` por migration que precisa de reversão |
| `supabase/tests/database/` | Testes pgTAP (`npx supabase test db`) |
| `supabase/seed.sql` | Dados de desenvolvimento gerados de `content/` (`npm run seed:write`; `seed:check` confere) |
| `supabase/templates/` | E-mails de convite e recuperação de senha do painel |
| `supabase/config.toml` | Configuração da stack local |

## Regras de mudança

1. **Migration nova**: nunca reescreva uma migration já aplicada em algum ambiente.
2. Constraints nomeadas, grants e políticas RLS coerentes com o domínio, pensando em `anon`,
   `authenticated` e em cada papel do painel.
3. Testes pgTAP para a regra nova. Antes de aplicar a migration, rode o teste contra o banco
   anterior: ele precisa falhar.
4. Rollback em `supabase/rollbacks/`, testado numa transação desfeita.
5. Rode `npm run test:migrations` (instalação limpa, upgrade com dados e reversão).
6. Documente no [dicionário de dados](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/banco/dicionario-de-dados.md).
7. PR com revisão de quem responde pelo banco.

> **Nunca** rode `supabase db push`, reset ou alteração num projeto remoto sem instrução explícita
> do responsável e confirmação do ambiente. Nunca use dado pessoal de produção em seed ou teste.

## Modelo de acesso

A autorização combina a checagem da aplicação (`requirePermission`) com políticas RLS que usam
`has_permission(recurso, ação)`. O visitante anônimo só lê o que está publicado, inclusive nos
vínculos N:M. A trilha `audit_log` é somente inclusão: nem o `service_role` altera ou apaga eventos.
A única exceção é a anonimização do autor quando a conta é excluída.

Detalhes: [estrutura do banco](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/banco/estrutura-do-banco-de-dados.md) ·
[matriz RBAC](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/matriz-rbac.md) ·
[trilha de auditoria](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/trilha-de-auditoria.md)
