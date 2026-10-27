# scripts/

| Script | Uso |
| ------ | --- |
| `file-headers.mjs` | `--check` valida e `--write` insere o cabeçalho padrão nos arquivos de código |
| `print-rbac-seed.mjs` | Gera o seed SQL de `role_permissions` a partir da matriz RBAC (Node 22.18+) |
| `provision-admin.mjs` | Convida contas do painel com papel inicial, sem compartilhar senhas (INT-08) |
| `test-supabase.mjs` | `npm run test:supabase`: testes de integração com a RLS real, só contra o Supabase local (DB-03) |
