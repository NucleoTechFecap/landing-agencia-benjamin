<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Instruções do projeto Agência Benjamin

- Leia `README.md`, `CONTRIBUTING.md` e os documentos em `docs/` antes de alterar arquitetura,
  segurança, banco, conteúdo editorial ou operação.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres/Auth/
  Storage/RLS), Vitest e Vercel. Use a versão Node indicada em `.nvmrc` e npm com `package-lock.json`.
- Para mudanças que afetem Next.js, consulte primeiro a documentação instalada em
  `node_modules/next/dist/docs/` e siga as APIs desta versão.
- Preserve separação entre `lib/domain` (regras puras), `lib/server` (I/O e acesso protegido) e
  `components` (interface). Não importe código de `lib/server` em componentes de cliente.
- Mudanças no banco devem usar migration versionada em `supabase/migrations/`, RLS, testes SQL
  quando aplicável e plano de rollback. Nunca conecte ou aplique migrations em produção sem uma
  instrução explícita do responsável.
- Não exponha tokens, chaves, dados pessoais ou conteúdo real de produção. Nunca grave segredos
  fora do gerenciador de segredos; `.env.example` contém somente nomes e valores fictícios.
- Trabalhe em branch e pull request. `main` e `production` são protegidas; não faça push direto,
  bypass de rulesets, merge ou deploy sem solicitação explícita.
- Para validar mudanças de aplicação, use os scripts existentes (`npm run verify` e, quando
  relevante, `npm run release:check`). Não invente scripts ou comandos destrutivos.
- Atualize documentação correspondente quando alterar contratos, regras operacionais, segurança,
  banco, variáveis ou fluxo de publicação.
