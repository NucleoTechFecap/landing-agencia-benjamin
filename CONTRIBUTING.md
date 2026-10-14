# Guia de contribuição

Convenções de branches, commits, pull requests e revisão da Plataforma Institucional Agência
Benjamin (GOV-10). Valem para todos os integrantes do NúcleoTech.

## 1. Fluxo resumido

1. Pegue uma issue atribuída a você no [Project](https://github.com/users/NucleoTechFecap/projects/4)
   e mova para **In progress**.
2. Atualize a `main` e crie a branch a partir dela.
3. Faça commits pequenos e coerentes, seguindo a convenção abaixo.
4. Rode `npm run verify` localmente.
5. Abra o PR para `main` usando o template, com `Closes #<issue>`.
6. Peça revisão; corrija os apontamentos; o merge é feito por quem aprovou ou pelo autor após aprovação.
7. A issue fecha automaticamente no merge e vai para **Done** no Project.

## 2. Branches

```text
<tipo>/<id-da-issue-em-minúsculas>-<descricao-curta>
```

| Tipo | Quando usar | Exemplo |
| ---- | ----------- | ------- |
| `feat/` | Nova funcionalidade | `feat/adm-02-autenticacao` |
| `fix/` | Correção de bug | `fix/qa-10-menu-mobile` |
| `docs/` | Somente documentação | `docs/arc-01-arquitetura` |
| `chore/` | Configuração, dependências, scripts | `chore/arc-03-estrutura-inicial` |
| `refactor/` | Mudança interna sem alterar comportamento | `refactor/case-02-template` |
| `test/` | Somente testes | `test/qa-04-cms-estados` |
| `hotfix/` | Correção urgente em produção | `hotfix/go-06-formulario` |

Regras: uma issue por branch; sem acentos ou espaços; nada de trabalho direto na `main`.

### PRs empilhados (dependências)

Quando a issue B depende do código da issue A ainda não mesclado, crie B a partir de A e abra o
PR de B com **base = branch de A**. Mescle sempre de baixo para cima. Ao mesclar A com
"Delete branch", o GitHub muda a base de B para `main` automaticamente; caso contrário, ajuste a
base manualmente antes do merge (os `Closes #n` só fecham issues em PRs cuja base é a `main`).

## 3. Commits — Conventional Commits em português

```text
<tipo>(<ID-DA-ISSUE>): <resumo no imperativo, minúsculo, até 72 caracteres>

<corpo opcional explicando o porquê e o que muda>
```

- Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `style`, `ci`, `build`.
- Escopo = ID da issue (ex.: `ADM-02`). Sem issue: escopo do módulo (`deps`, `seo`).
- Exemplos:
  - `feat(ADM-02): implementa login com Supabase Auth`
  - `fix(QA-10): corrige foco preso no menu mobile`
  - `docs(TECH-04): especifica máquina de estados de publicação`
- Um commit = uma mudança lógica. Separe refatoração de comportamento novo.
- Nunca commite segredos, `.env*` (exceto `.env.example`), dumps de banco ou dados pessoais.
- Mensagens em português; código e nomes de variáveis em inglês; textos de interface em pt-BR.

## 4. Pull requests

- **Título:** mesmo formato do commit principal — `feat(ADM-02): autenticação da equipe`.
- **Descrição:** use o template (`.github/pull_request_template.md`): resumo, entregas, como
  validar, evidências (prints/vídeo para UI) e `Closes #<n>`.
- **Tamanho:** prefira PRs com até ~400 linhas alteradas (sem contar lockfile e docs).
- **Rascunho:** abra como *Draft* enquanto não estiver pronto para revisão.
- **Revisão obrigatória:** 1 aprovação. PRs críticos (autenticação, permissões, RLS,
  publicação, formulários com dados pessoais, integrações) exigem revisão da coordenação técnica
  — ver [`docs/qualidade/revisao-de-prs.md`](docs/qualidade/revisao-de-prs.md) (TECH-13).
- **Merge:** *Merge commit* para PRs de tarefa (preserva os commits separados por issue);
  *Squash* apenas para PRs com commits de ajuste ("wip", "fix lint").
- **Após o merge:** apague a branch remota.

### Checklist de PR

- [ ] Branch e commits seguem a convenção (tipo + ID da issue)
- [ ] `npm run verify` passou localmente (cabeçalhos, tipos, lint, testes, build)
- [ ] Arquivos novos/alterados com cabeçalho padrão e histórico atualizado
- [ ] Sem segredos, dados pessoais reais ou conteúdo provisório marcado como final
- [ ] Mudanças em banco têm migration versionada com RLS e plano de rollback
- [ ] Autorização verificada no servidor (não apenas na interface)
- [ ] Textos acessíveis: rótulos, `alt`, contraste e navegação por teclado
- [ ] Testado em mobile (360 px) e desktop
- [ ] Documentação atualizada quando a regra/contrato mudou
- [ ] Issue vinculada com `Closes #n` e movida para **In progress** no Project

## 5. Conflitos

1. Atualize a branch com a base: `git fetch origin && git rebase origin/main`
   (ou `git merge origin/main` se a branch já foi compartilhada).
2. Resolva arquivo a arquivo, rode `npm run verify` e faça `git push --force-with-lease`
   (nunca `--force` puro, nunca na `main`).
3. Em conflitos de regra de negócio, chame o autor do outro PR antes de escolher um lado.

## 6. Proteção da `main` (configuração do repositório)

Recomendações para o administrador do repositório (Settings → Rules → Rulesets):

- Exigir PR antes do merge, com **1 aprovação** e descarte de aprovações após novos commits.
- Exigir resolução de conversas antes do merge.
- Exigir status checks quando o CI (ARC-08) estiver ativo: `verify`.
- Bloquear *force push* e exclusão da `main`.
- Habilitar "Automatically delete head branches".

## 7. Definição de pronto (DoD)

Uma issue está **Done** quando: critérios de aceite atendidos, PR aprovado e mesclado,
`verify` verde, documentação atualizada e evidências anexadas à issue (prints, links de
homologação ou saída de testes).

## 8. Cabeçalho padrão

Todo arquivo de código começa com o bloco de cabeçalho do projeto (ver README). Ao alterar um
arquivo existente, atualize **Modificado em** e acrescente uma linha ao **Histórico** com data,
autor e o ID da issue.
