# CI-CD e releases

## Checks de pull request

O workflow `.github/workflows/ci.yml` roda em PRs para `main` e `production`:

| Check | O que valida |
| --- | --- |
| `verify` | `npm ci` e `npm run verify` (cabeçalhos, formatação, tipos, lint, testes e build) |
| `release-source` | Em PRs para `production`, que a origem é a `main` |
| `release-content` | Em PRs para `production`, que não há conteúdo provisório publicado |

Fora de PRs para `production`, os dois últimos informam que não se aplicam. Os nomes ficam estáveis
nas duas branches. Dependabot monitora npm e GitHub Actions; CodeQL analisa o código.

A Vercel também gera uma **pré-visualização por PR** e comenta o link no próprio PR. Abra a
pré-visualização antes do merge.

## Regras das branches

- Só `Vinishireis`, `VinnizzZ` e `NucleoTechFecap` atualizam `main` e `production`, e sempre por PR.
- O PR exige uma aprovação independente, aprovação da última atualização, histórico linear e os
  três checks.
- Sem force push e sem exclusão das branches protegidas.

## Como uma versão chega à produção

1. Tudo entra na `main` por PR.
2. Go/no-go técnico (TECH-14): checklist de evidências e riscos.
3. Tag `vX.Y.Z` na `main` e migrations pendentes aplicadas em produção, com backup recente.
4. PR `main → production`; o merge aprovado publica pela Vercel.
5. Smoke test (health, páginas, formulário de teste, login no painel, `robots.txt`) e decisão de
   manter ou reverter.

| Documento | Para quê |
| --- | --- |
| [CI e regras de branch](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/ci-cd-github-actions.md) | Detalhe dos checks e rulesets |
| [Release e rollback (GO-01)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/release-e-rollback.md) | Checklist, smoke test e critérios de rollback |
| [Go/no-go (TECH-14)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/go-no-go.md) | Evidências e decisão técnica |
| [Publicação do MVP (GO-06)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/publicacao-mvp.md) | Roteiro do dia da publicação |
| [Provisionamento (GO-02)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/provisionamento-producao.md) | Criação de homologação e produção |
| [Domínio e HTTPS (GO-03)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/dominio-dns-https.md) | DNS e a decisão de publicar em `*.vercel.app` até o domínio sair |
