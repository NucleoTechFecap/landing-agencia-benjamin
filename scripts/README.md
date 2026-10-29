# scripts/

| Script | Uso |
| ------ | --- |
| `file-headers.mjs` | `--check` valida e `--write` insere o cabeçalho padrão nos arquivos de código |
| `print-rbac-seed.mjs` | Gera o seed SQL de `role_permissions` a partir da matriz RBAC (Node 22.18+) |
| `provision-admin.mjs` | Convida contas do painel com papel inicial, sem compartilhar senhas (INT-08) |
| `test-supabase.mjs` | `npm run test:supabase`: testes de integração com a RLS real, só contra o Supabase local (DB-03) |
| `test-migrations.mjs` | `npm run test:migrations`: instalação limpa, seed, upgrade e reversão das migrations no Supabase local (DBX-02) |
| `explain-queries.mjs` | `npm run perf:queries`: planos de execução das consultas do site e do painel, vazio e com volume sintético, no Supabase local (DBX-03) |
| `content-seed.mjs` | `npm run seed:write` / `seed:check`: gera `supabase/seed.sql` a partir de `content/` (DBX-02) |
| `e2e-cms.mjs` | `npm run test:e2e:cms`: build contra o Supabase local e jornadas E2E do CMS (`@cms`, TECH-12) |
