# supabase/

Migrations SQL versionadas (`migrations/AAAAMMDDHHMMSS_descricao.sql`), aplicadas com a
Supabase CLI:

```bash
npx supabase start && npx supabase db reset   # banco local limpo: migrations + seed
supabase link --project-ref <ref-do-ambiente>
supabase db push --dry-run && supabase db push   # remoto: só migrations, nunca o seed
```

Regras: toda tabela nova habilita RLS na mesma migration; toda migration nova traz o seu
`rollbacks/<migration>.down.sql` (o `npm run test:migrations` falha sem ele); nada de `drop` sem
plano de rollback (GO-01); seeds de produção só com autorização (GO-04).

| Pasta / arquivo | Conteúdo |
| --------------- | -------- |
| `migrations/` | Migrations aplicadas pelo CLI (`db reset` local, `db push` remoto) |
| `rollbacks/` | `<migration>.down.sql` de **todas** as migrations: reversão manual, em ordem inversa e após backup; depois `supabase migration repair --status reverted <versão>` |
| `seed.sql` | Dados **fictícios** de desenvolvimento, gerados de `content/` (`npm run seed:write`). Só o `db reset` local roda; recusa banco marcado com `app.ambiente = 'producao'` |
| `tests/` | Testes pgTAP (`npx supabase db reset && npx supabase test db`) |

`npm run test:migrations` verifica no banco local a instalação limpa, a trava do seed, o upgrade
com dados e a reversão completa seguida de reaplicação. Nunca use `supabase db reset --linked`:
ele apaga o banco remoto.

Integração do código com a RLS real: `npm run test:supabase` roda `tests/integration/supabase`
com as chaves do stack local (`npx supabase status`). Sem o stack no ar, esses testes são pulados
no `npm test`.

Modelo, convenções e procedimento completo: [dicionário de dados](../docs/banco/dicionario-de-dados.md) §9.
