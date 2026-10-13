# lib/

| Pasta | Pode importar | Não pode importar |
| ----- | ------------- | ----------------- |
| `config/` | `zod` | `domain/`, `server/`, React |
| `domain/` | `config/`, `zod` | `server/`, `next/*`, Supabase, React |
| `server/` | `config/`, `domain/`, `next/*`, Supabase | `components/` |

`domain/` contém regras puras e testáveis (sem I/O). `server/` contém tudo que toca rede,
banco, cookies ou cache e começa com `import "server-only"`.

As regras acima são verificadas pelo ESLint (`no-restricted-imports`) — ver ADR-0003 (TECH-01).
