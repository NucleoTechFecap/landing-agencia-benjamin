# Ambientes e variáveis

## Ambientes

- **Local:** `npm run dev`; preferir Supabase local ou projeto de desenvolvimento e dados fictícios.
- **Preview:** deploy associado a pull request na Vercel; usado para revisar mudanças.
- **Homologação:** ambiente de validação da equipe antes da liberação pública.
- **Produção:** ambiente público da Agência Benjamin, com projeto e segredos próprios.

O vínculo efetivo entre branches, projetos e domínios depende das configurações da Vercel. Confirme
o projeto e o ambiente no painel antes de executar qualquer operação. A branch `main` é protegida;
use pull request para integrá-la.

## Variáveis

As variáveis documentadas incluem `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_ENV`, variáveis
`NEXT_PUBLIC_SUPABASE_*`, credenciais de servidor, configurações Resend e segredos de tarefas
internas. A lista, obrigatoriedade e escopo de cada valor estão em
[`docs/ambientes/variaveis-de-ambiente.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/ambientes/variaveis-de-ambiente.md).

`NEXT_PUBLIC_*` é incorporada ao bundle do cliente e não pode conter segredo. A chave
`SUPABASE_SERVICE_ROLE_KEY` ignora RLS e só pode ser usada no servidor para operações explicitamente
permitidas. Nunca coloque credenciais em commits, logs, Wiki ou mensagens públicas.

## Rotação de chave

Ao suspeitar de vazamento, revogue a chave no provedor, atualize a variável no ambiente correto,
publique um novo deployment e confirme o funcionamento. Siga o documento de variáveis e o plano de
incidentes; não cole a chave comprometida em um chamado.
