# supabase/

Migrations SQL versionadas (`migrations/AAAAMMDDHHMMSS_descricao.sql`), aplicadas com a
Supabase CLI:

```bash
supabase link --project-ref <ref-do-ambiente>
supabase db push            # aplica migrations pendentes
```

Regras: toda tabela nova habilita RLS na mesma migration; nada de `drop` sem plano de rollback
(GO-01); seeds de produção só com autorização (GO-04).
