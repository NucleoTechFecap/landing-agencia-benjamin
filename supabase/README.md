# supabase/

Migrations SQL versionadas (`migrations/AAAAMMDDHHMMSS_descricao.sql`), aplicadas com a
Supabase CLI:

```bash
supabase link --project-ref <ref-do-ambiente>
supabase db push            # aplica migrations pendentes
```

Regras: toda tabela nova habilita RLS na mesma migration; nada de `drop` sem plano de rollback
(GO-01); seeds de produção só com autorização (GO-04).

| Pasta | Conteúdo |
| ----- | -------- |
| `migrations/` | Migrations aplicadas pelo CLI (`db reset` local, `db push` remoto) |
| `rollbacks/` | `<migration>.down.sql`: reversão manual, em ordem inversa e após backup; depois `supabase migration repair --status reverted <versão>` |
| `tests/` | Testes pgTAP (`npx supabase db reset && npx supabase test db`) |

Modelo, convenções e procedimento completo: [dicionário de dados](../docs/banco/dicionario-de-dados.md) §9.
