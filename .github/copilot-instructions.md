# Instruções do GitHub Copilot — Agência Benjamin

Antes de alterar o projeto, consulte `AGENTS.md`, `README.md`, `CONTRIBUTING.md` e a documentação
relacionada em `docs/`. Siga os padrões do projeto e mantenha o escopo da tarefa solicitado.

## Contexto técnico

- Next.js 16 App Router e React 19; TypeScript; Tailwind CSS 4.
- Supabase fornece Postgres, Auth e Storage. A autorização é aplicada no servidor e reforçada por
  RLS. Resend envia notificações. A hospedagem e os deploys são feitos pela Vercel.
- Use Node definido em `.nvmrc`, `npm ci` e os scripts existentes em `package.json`.
- Antes de mudar APIs, convenções ou estrutura do Next.js, leia a documentação local em
  `node_modules/next/dist/docs/`.

## Regras de implementação

- Mantenha `lib/domain` independente de framework e I/O, `lib/server` como camada de servidor e
  `components` sem acesso a módulos `lib/server`.
- Valide dados de entrada no servidor com os schemas existentes. Não considere controles de UI como
  autorização.
- Toda migration deve ser versionada, proteger dados com RLS e incluir estratégia de rollback.
- Não inclua segredos, dumps, dados pessoais reais ou conteúdo provisório como conteúdo final.
- Preserve acessibilidade, responsividade, cabeçalhos de arquivo e formatação definida pelo repo.
- Nunca faça deploy, aplique migration em ambiente remoto, altere regras do repositório ou faça
  merge/bypass. Entregue as alterações por branch e pull request para revisão humana.

## Verificação

Use `npm run verify` para a validação completa quando a tarefa envolver código. Para publicação,
consulte `docs/operacao/release-e-rollback.md` e `docs/operacao/go-no-go.md`.
