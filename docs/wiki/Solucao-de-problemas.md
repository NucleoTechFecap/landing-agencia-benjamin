# Solução de problemas

## `npm ci` falha

Confira a versão Node em `.nvmrc`, conexão com o registry npm e se `package-lock.json` está junto
com as alterações de dependências. Não substitua `npm ci` por instalação sem lockfile no CI.

## Build ou validação local falha por variável ausente

Compare os nomes em `.env.example` e `docs/ambientes/variaveis-de-ambiente.md`. Use valores
fictícios ou credenciais do ambiente local autorizadas. Não peça nem publique segredos em issues.

## Site mostra conteúdo provisório

Sem Supabase válido, o modo local pode usar fixtures em `content/`. Confirme variáveis e fonte do
conteúdo conforme o ambiente. O gate de release bloqueia conteúdo provisório; não remova o gate para
publicar.

## Pull request bloqueado

Abra os detalhes do merge status: corrija checks falhos, aguarde a aprovação requerida e resolva
conversas. Se um check esperado não aparecer, confirme se o workflow foi executado no último commit
e se o nome do job corresponde ao ruleset. Não faça push direto na branch protegida.

## Deployment falha ou health check não responde

Consulte os logs do deployment, variáveis do ambiente correto e status do provedor. Compare com o
último deployment bem-sucedido. Se o incidente justificar, siga [[Operação e incidentes]] e o
procedimento formal de rollback; não altere dados remotos como tentativa de diagnóstico.
