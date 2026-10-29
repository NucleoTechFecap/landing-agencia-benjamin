# Contribuição

## Fluxo

1. Pegue uma issue do [Project](https://github.com/users/NucleoTechFecap/projects/4) e crie uma
   branch a partir da `main` atualizada: **uma task por branch**.
2. Nome de branch curto, sem acento, com o tipo e o ID da task: `feat/adm-07-crud-areas`,
   `fix/tech-13-…`, `docs/go-09-…`.
3. Commits em português no formato **`tipo(ID): resumo`**, por exemplo
   `fix(TECH-13): bucket de mídia sem listagem anônima`. Separe código, testes e documentação em
   commits próprios quando fizer sentido.
4. Todo arquivo de código começa com o **cabeçalho padrão** (sistema, módulo, descrição,
   desenvolvedor e histórico). `npm run headers:write` cria o cabeçalho; `npm run check:headers`
   confere.
5. Rode `npm run verify` antes de abrir o PR.
6. Abra o PR para a `main` usando o template, com resumo, evidências, checklist e `Refs #issue`.
7. Aguarde a revisão e os checks. Resolva as conversas antes do merge.

## Regras das branches protegidas

- `main` e `production` só aceitam mudança por pull request.
- O PR exige **uma aprovação independente** (de quem não escreveu o código), aprovação da última
  atualização e os checks `verify`, `release-source` e `release-content`.
- O histórico é **linear**: o merge é feito por squash ou rebase.
- Sem force push, sem exclusão de branch protegida e sem bypass para pular a revisão.

## O que exige cuidado extra

- **Banco:** migration nova (nunca editar uma já aplicada), RLS, testes pgTAP e rollback em
  `supabase/rollbacks/`. Veja [[Banco de dados e migrations]].
- **Segurança, permissões, dados pessoais, publicação e integrações:** revisão de quem responde pela
  frente (CODEOWNERS) e registro em
  [`docs/qualidade/revisao-de-prs.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/revisao-de-prs.md).
- **Documentação:** mudou um contrato, uma regra operacional, uma variável ou o fluxo de publicação?
  Atualize `docs/` e, se for o caso, esta Wiki (`docs/wiki/`) no mesmo PR.

Nunca adicione credenciais, dumps, dados pessoais reais ou conteúdo provisório marcado como final.

Guia normativo completo:
[`CONTRIBUTING.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/CONTRIBUTING.md).
