# Testes e qualidade

## Camadas de teste

| Comando | O que cobre | Precisa de |
| --- | --- | --- |
| `npm test` | Regras de domínio, serviço do CMS (com store em memória), contratos da API, conformidade do conteúdo | Nada |
| `npx supabase test db` | Testes pgTAP em `supabase/tests/database/`: constraints, integridade referencial, RLS por papel, auditoria e Storage | Supabase local |
| `npm run test:supabase` | Integração real: RLS com usuários de cada papel, upload no Storage, visibilidade pública | Supabase local |
| `npm run test:migrations` | Instalação limpa, upgrade com dados, seed e reversão das migrations | Supabase local (**apaga o banco local**) |
| `npm run test:restore` | Cópia criptografada e restauração em stack nova, com conferência de dados, arquivos, RLS e pgTAP | Supabase local, Git Bash no Windows |
| `npm run test:e2e` | Jornadas do visitante no navegador, com o conteúdo versionado | Build (`npm run build`) e Chrome |
| `npm run test:e2e:cms` | Jornada do editor (cria, publica, edita e arquiva um case, e confere o site), menu, visão geral e todas as telas do painel em 360, 768 e 1280 px | Supabase local e Chrome (faz o próprio build) |
| `npm run verify` | Cabeçalhos, formatação, tipos, lint, `npm test` e build: o mesmo do CI | Nada |
| `npm run release:check` | `verify` mais o gate que bloqueia conteúdo provisório publicado | Nada |

Depois do `test:e2e:cms`, rode `npm run build` de novo antes do `test:e2e`: o primeiro deixa um build
apontado para o Supabase local.

## Princípios

- **Teste que prova a correção:** um teste de regressão deve falhar sem a correção. Para RLS, rode o
  pgTAP novo contra o banco anterior à migration antes de aplicá-la.
- **Massa própria:** testes de integração criam e apagam os próprios dados, sem depender do que
  existe no banco local.
- **Sem dado real:** usuários de teste são fictícios (`*@teste.local`), e nenhum teste toca produção.

## Documentos de qualidade

- [Matriz de testes alinhada aos critérios de aceite (QA-01)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/matriz-de-testes.md)
- [Jornadas críticas e testes E2E](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/jornadas-e2e.md)
- [Testes de CRUD e estados de publicação do CMS (QA-04)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/qa-04-cms.md)
- [Roteiro e checklist de homologação da Benjamin (QA-08)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/homologacao.md)
- [Roteiro de reprodução do ambiente com seed (ARC-11)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/arc-11-reproducao-do-seed.md)
- [Revisão de PRs críticos e registro de revisões (TECH-13)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/revisao-de-prs.md)
- [Critérios de aceite (GOV-13)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/gestao/criterios-de-aceite.md)
