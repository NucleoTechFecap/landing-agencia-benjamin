# CI, publicação e regras de branch

## Fluxo

- Pull requests para `main` e `production` executam `verify`, que roda cabeçalhos, formatação, tipos, lint, testes e build de produção.
- Pull requests para `production` também exigem `release-source` (origem `main`) e `release-content` (sem conteúdo provisório).
- O merge em `main` atualiza a homologação; a integração GitHub → Vercel continua responsável pelos previews e deploys automáticos.
- O merge aprovado de `main` para `production` publica em produção pela Vercel. O workflow do GitHub Actions valida o release antes do merge; ele não publica uma segunda vez via CLI.

## Regrasets do GitHub

As regras protegem `main` e `production`:

1. **Acesso de atualização:** somente `Vinishireis`, `VinnizzZ` e `NucleoTechFecap` podem atualizar as branches protegidas. Essa regra é separada dos requisitos de PR para que os usuários autorizados também continuem obrigados a usar PR.
2. **Pull request e CI:** exige PR, uma aprovação, aprovação de CODEOWNER, histórico linear, sem force push ou exclusão, e checks `verify`, `release-source` e `release-content`.

`release-source` só valida PRs com destino `production`; `release-content` só executa para releases em `production`. Para outras execuções, esses jobs informam que não se aplicam. Assim os nomes dos checks permanecem estáveis nas duas branches.

> O repositório ainda não possui a branch `production`. A regra já pode ser direcionada a ela, mas o primeiro PR de release só ficará disponível depois da criação dessa branch a partir de `main`.
