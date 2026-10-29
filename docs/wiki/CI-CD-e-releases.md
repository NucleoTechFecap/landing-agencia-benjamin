# CI/CD e releases

## Pull requests

O workflow `.github/workflows/ci.yml` roda em PRs destinados a `main` e `production`. O job
`verify` instala as dependências com `npm ci` e roda `npm run verify`. PRs para `production` também
validam a origem `main` (`release-source`) e o conteúdo de release (`release-content`). Dependabot
monitora npm e GitHub Actions. CodeQL analisa JavaScript/TypeScript.

## Regras de branch

As regras do repositório exigem PR, revisão e checks configurados, além de bloquear force push e
exclusões nas branches protegidas. A lista de usuários autorizados a atualizar refs está configurada
em um ruleset separado. A autorização de bypass não substitui o fluxo normal de PR.

## Entrega

O merge em branch conectada à Vercel inicia o deployment correspondente. Preview de PR deve ser
inspecionado antes do merge. Para produção, siga o checklist GO-01 e confirme no painel da Vercel
qual branch está configurada como Production; não presuma que o nome da branch documentado equivale
à configuração atual.

## Checklist mínimo

1. Review independente e conversas resolvidas.
2. Checks obrigatórios verdes e conteúdo válido para o ambiente alvo.
3. Variáveis e banco compatíveis com a versão.
4. Smoke test após o deployment.
5. Deployment anterior identificado para rollback.

Detalhes: [`docs/operacao/ci-cd-github-actions.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/ci-cd-github-actions.md)
e [`docs/operacao/release-e-rollback.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/release-e-rollback.md).
