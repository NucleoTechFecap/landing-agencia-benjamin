# QA-04 — CRUD e estados de publicação do CMS

| Campo        | Valor                                                                                   |
| ------------ | --------------------------------------------------------------------------------------- |
| Issue        | QA-04 (#182)                                                                            |
| Execução     | 27/10/2026                                                                              |
| Ambiente     | Local: `next start` (build de produção) + Supabase local (Postgres 17, RLS e Storage reais), Chromium headless |
| Escopo       | Áreas (ADM-07), serviços (ADM-06), cases e categorias (ADM-08), biblioteca de mídia, site lendo o CMS (INT-02) |
| Fora do escopo | CTAs, páginas e configuração no painel (ADM-10/11, ADM-05 — telas ainda não existem); homologação (GO-02) |

## 1. Como reexecutar

```bash
npm run test                                   # regras do CMS, inclusive a matriz de publicação
npx supabase start && npx supabase db reset
npm run test:supabase                          # RLS, Storage e visibilidade pública reais
```

Os roteiros de navegador (seção 3, tipo **NAV**) foram executados com Playwright contra
`next start` apontado para o Supabase local; a automação permanente da jornada do editor está nas
jornadas E2E (TECH-12, [`jornadas-e2e.md`](jornadas-e2e.md)).

## 2. Massa de teste

- Usuários criados por teste com papéis `viewer`, `editor` e `admin` (contas descartáveis
  `*@teste.local`, removidas ao final).
- Conteúdo com slugs sufixados por execução (sem colisão com dados de desenvolvimento) e removido
  ao final; imagens de teste a partir de `public/brand/cases/*.webp`.
- Estados cobertos: rascunho, publicado, arquivado e publicado com data futura (agendado).

## 3. Casos de teste

Tipos: **UNI** regra com store em memória · **INT** Supabase local com RLS real · **NAV** navegador.

| # | Cenário | Esperado | Observado | Tipo | Evidência |
| - | ------- | -------- | --------- | ---- | --------- |
| CT-01 | Comandos de publicação × estado de origem × papel, para área, serviço, categoria e case (240 combinações) | Transição inválida → `INVALID_TRANSITION`; papel sem permissão → `FORBIDDEN` sem gravar, auditar nem invalidar; permitida → estado e datas coerentes (I2/I3), 1 evento de auditoria, cache invalidado só quando o público é afetado | Conforme | UNI | `lib/server/cms/publication-matrix.test.ts` |
| CT-02 | Criar item | Nasce rascunho, invisível ao visitante, auditado como `content.created` | Conforme | UNI, INT, NAV | `content-service.test.ts`, `cms-areas.test.ts` |
| CT-03 | Campos inválidos (slug fora do padrão, slug repetido, link sem https, ícone fora da lista) | Erro no campo, nada gravado, valores digitados preservados | Conforme (após B-01) | UNI, NAV | `content-service.test.ts`, roteiro NAV de áreas e cases |
| CT-04 | Publicar incompleto | Lista do que falta com o nome do campo do painel; nada muda | Conforme (após B-06) | UNI, INT, NAV | `cases.test.ts`, `services.test.ts`, `cms-areas.test.ts` |
| CT-05 | Publicar com dependência em rascunho (case com categoria em rascunho) | Bloqueado com a regra de integridade (R06) | Conforme | UNI | `cases.test.ts` |
| CT-06 | Editar item publicado | Continua publicado, revalida o conteúdo (I5), slug travado, site atualizado | Conforme (após B-04/B-05) | UNI, NAV | `content-service.test.ts`, roteiro INT-02 |
| CT-07 | Edição concorrente (duas abas) | Segunda gravação recusada: "alterado por outra pessoa" | Conforme | UNI, INT, NAV | `cms-areas.test.ts`, roteiro NAV de áreas |
| CT-08 | Arquivar/despublicar item do qual o site depende (área única de serviço publicado, serviço único de case, categoria de case publicado) | Bloqueado, com a lista do que quebraria | Conforme | UNI, INT | `content-service.test.ts`, `services.test.ts`, `cases.test.ts`, `cms-cases.test.ts` |
| CT-09 | Arquivar → restaurar → publicar | Some do site (404 no detalhe e na API), volta como rascunho (404), republicado (200) | Conforme | NAV | roteiro INT-02 |
| CT-10 | Excluir | Só arquivado e só `admin`; categoria usada por qualquer case bloqueada | Conforme | UNI, INT | `publication-matrix.test.ts`, `cases.test.ts`, `cms-areas.test.ts` |
| CT-11 | Leitor (`viewer`) | Vê tudo só leitura; sem botões de publicação; `/nova` → "sem permissão"; RLS recusa gravação direta | Conforme | INT, NAV | `cms-areas.test.ts`, `cms-servicos.test.ts`, roteiro NAV de áreas |
| CT-12 | Rascunho, arquivado e agendado invisíveis | Nada em listas, sitemap, `llms.txt`, API, detalhe (404) nem em leitura direta das tabelas e vínculos | Conforme — 0 vazamentos em 22 URLs | INT, NAV | `visibilidade-publica.test.ts`, smoke de URLs |
| CT-13 | Auditoria crítica indisponível | Publicação abortada sem gravar | Conforme | UNI | `content-service.test.ts` |
| CT-14 | Envio de mídia | `alt` obrigatório (exceto decorativa), SVG/HTML renomeado recusado, leitor barrado no Storage, falha no registro apaga o arquivo | Conforme | UNI, INT, NAV | `media-service.test.ts`, `cms-cases.test.ts` |
| CT-15 | Publicação reflete no site sem redeploy | Listas, Home e API na hora; detalhe já na primeira visita | Conforme (após B-05) | NAV | roteiro INT-02, ADR-0006 |
| CT-16 | Painel no celular (390 px) | Sem rolagem horizontal | Conforme | NAV | roteiro NAV de áreas |

## 4. Defeitos encontrados

Todos foram encontrados durante a execução, corrigidos e retestados nos PRs indicados.

| # | Defeito | Passos para reproduzir | Severidade | Correção | Reteste |
| - | ------- | ---------------------- | ---------- | -------- | ------- |
| B-01 | Depois de um erro de validação, os `<select>` (categoria, capa) voltavam à opção inicial e o case era salvo sem eles | Novo case → preencher categoria e capa + link inválido → salvar → corrigir o link → salvar | Alta | `d4aae73` (PR #281) | ✅ |
| B-02 | Sugestão de slug não funcionava no case (lia o campo `name`, o case usa `title`) | Novo case → digitar título → entrar no campo endereço | Baixa | `08751d2` (PR #281) | ✅ |
| B-03 | Erro "unstable value Date.now()" no servidor a cada revalidação das telas do painel | Abrir `/admin/areas/<id>` e observar o log do `next start` | Média | `274c3a4` (PR #279) | ✅ 0 ocorrências |
| B-04 | `fetch` do supabase-js caía no Data Cache do Next sem tags: um build reaproveitou respostas vazias de outro (case publicado com 404) e `updateTag` não limparia essa camada | Build com banco vazio → popular → novo build → abrir o detalhe | Alta | `a0a861c` (PR #278) | ✅ |
| B-05 | Primeira visita ao detalhe de serviço/case após salvar vinha com a versão anterior | Salvar um serviço publicado → abrir `/servicos/<slug>` imediatamente | Média | `c77c7f0` (PR #282) | ✅ 2/2 rodadas |
| B-06 | Mensagens de campo ausente do case eram técnicas ("expected string, received undefined") | Criar case só com título → olhar "Para publicar, falta" | Baixa | `08751d2` (PR #281) | ✅ |
| B-07 | `SelectField` ignorava a dica (`hint`) | Formulário de serviço → campo Imagem | Baixa | `f2c6bda` (PR #280) | ✅ |
| B-09 | Sugestão de slug feita no foco do campo se juntava ao texto colado ou digitado | Novo case → digitar o título → colar o endereço no campo slug → salvar | Média | Slug gerado no servidor quando em branco (TECH-12) | ✅ E2E J2.5 |
| B-08 | Login: o formulário de *fallback* do `Suspense` é trocado pelo definitivo e o que foi digitado antes da troca se perde | Abrir `/admin/login` em rede lenta e digitar antes da página terminar de carregar | Média | Branch própria do ADM-02 | ⏳ ver ADM-02 |

## 5. Pendências

- Reexecutar CT-02 a CT-15 em **homologação** com o Supabase de homologação (GO-02) — roteiro
  manual do QA (QA-11).
- Telas de CTAs, páginas e configuração (ADM-05, ADM-10, ADM-11) entram nesta matriz quando
  existirem; as regras de servidor já são as mesmas (`content-service.ts`).
