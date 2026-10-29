# Banco de dados e migrations

O backend usa Supabase/PostgreSQL. O diretório `supabase/migrations/` registra alterações de schema
em ordem temporal; `supabase/rollbacks/` contém scripts de reversão disponíveis. Consulte
[`docs/banco/estrutura-do-banco-de-dados.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/banco/estrutura-do-banco-de-dados.md)
e o [dicionário de dados](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/banco/dicionario-de-dados.md).

## Regras de mudança

1. Adicione uma migration nova; não reescreva migration já compartilhada.
2. Inclua constraints nomeadas, grants e políticas RLS coerentes com o domínio.
3. Considere usuários anônimos, autenticados e os papéis administrativos aplicáveis.
4. Inclua cobertura SQL ou de integração quando fizer sentido.
5. Documente reversão e compatibilidade entre a versão antiga e nova da aplicação.
6. Aplique primeiro em ambiente de desenvolvimento/homologação e valide antes de produção.

Não execute `supabase db push`, reset ou alteração em projeto remoto sem solicitação explícita e
confirmação do ambiente. Nunca use dados pessoais de produção em seeds ou testes.

## Modelo de acesso

A autorização administrativa combina a verificação da aplicação com políticas de Row Level
Security. A matriz de papéis e permissões está em `docs/seguranca/matriz-rbac.md`; mudanças em RLS
devem ser revisadas com atenção especial.
