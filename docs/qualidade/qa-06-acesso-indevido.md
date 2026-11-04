# QA-06 — Acesso indevido e proteção de dados · INT-06 — Links e CTAs

| Campo        | Valor                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Issues       | QA-06 (#184) e INT-06 (#172, seção 8 deste documento)                                                   |
| Execução     | 04/11/2026                                                                                              |
| Versão       | `8e55596`, branch `test/qa-06-acesso-links-e-telas`, sobre a `main` em `6959c27`                         |
| Ambiente     | Local: `next start` (build de produção) + Supabase local (Postgres 17, Auth, RLS, PostgREST e Storage reais), Chrome headless |
| **Fora do escopo: não executado** | Homologação e produção. **Nada aqui rodou contra o site publicado nem contra banco remoto.** Teste de invasão por terceiro, força bruta e negação de serviço. Telas de PRs ainda abertos: prévia protegida (ADM-14), exclusão de mídia (ADM-09) e CTAs (ADM-11), que precisam entrar aqui quando chegarem à `main` |

> **Resultado: nenhuma violação crítica no ambiente local.** Os achados estão na seção 6, com severidade. O critério da
> issue só fica completo depois de repetir em homologação, com as chaves e as políticas de lá.

## 1. Como reexecutar

```bash
npx supabase start && npx supabase db reset
npm run test:e2e:cms -- tests/e2e/acesso-indevido-painel.spec.ts tests/e2e/acesso-indevido-dados.spec.ts
npm run build && npm run test:e2e -- tests/e2e/acesso-indevido-dados.spec.ts tests/e2e/links-e-ctas.spec.ts
```

`scripts/e2e-cms.mjs` gera `CONTENT_REVALIDATE_SECRET` e `CRON_SECRET` descartáveis a cada execução, para exercitar as
rotas internas também com o token certo.

## 2. Massa de teste

- Contas `*@teste.local` com cada papel (`super_admin`, `admin`, `editor`, `viewer`, `pending`) e um `admin` desativado.
  A sessão é aberta direto no Auth, sem a tela de login: é o que alguém faria com a própria conta. Por isso `pending`
  chega ao servidor com sessão válida.
- Áreas, serviços, categorias, cases, páginas, blocos, CTAs e mídia em rascunho, arquivados e agendados, com sufixo
  aleatório, removidos ao final. Cada worker prepara a própria massa, e nenhum teste depende de ordem.
- Envios fictícios (`teste.e2e@exemplo.com`). Nenhum dado pessoal real.
- As listas de rotas de `app/admin`, de `app/api/v1`, de Server Actions (manifesto do build) e de tabelas expostas
  (OpenAPI do PostgREST) são **deduzidas**: rota, ação ou tabela nova falha o teste até ser classificada.

## 3. Cenários

`P` é `tests/e2e/acesso-indevido-painel.spec.ts`, e `D` é `tests/e2e/acesso-indevido-dados.spec.ts`.

### 3.1 Rotas do painel sem sessão

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-01 | Toda rota de `app/admin` fora as 3 públicas autorizadas. Com id: UUID inexistente, malformado, injeção, travessia, `%00` e 1.500 caracteres | 307 para `/admin/login`, sem conteúdo do painel | Conforme | P |
| CT-02 | Lista de rotas públicas | Só login, recuperação e o retorno do e-mail, em código e no disco | Conforme | P |
| CT-03 | `RSC: 1`, pré-busca, `?_rsc=`, outros métodos HTTP | 307 para o login | Conforme | P |
| CT-04 | Cabeçalhos forjados: `x-middleware-subrequest` (CVE-2025-29927), `x-invoke-path`, `x-matched-path`, `x-nextjs-data`, IP local | 307 para o login | Conforme | P |
| CT-05 | 28 escritas alternativas: `/ADMIN`, `/%61dmin`, `/admin//leads`, `/admin/(painel)/leads`, `/admin/leads.rsc`, `/admin/login/..%2Fleads`, `%00`, `;x=1` e outras, enviadas sem normalização | Login ou 4xx, nunca 200 com conteúdo | Conforme | P |
| CT-06 | `next` externo no login e no retorno do e-mail | Fica no site | Conforme | P |

### 3.2 Server Actions

Todas as ações de `app/admin`, por POST real, no formato capturado do navegador. Cada ação tem um **controle**: o mesmo
pedido, com o papel certo, grava. Sem isso, a recusa poderia ser só um erro de formato. "Nada gravado" compara a linha
inteira antes e depois, inclusive `updated_at`.

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-07 | Sem sessão: na tela da ação, e por `/`, `/contato` e `/admin/login` com `Next-Action`, e sem JavaScript (`$ACTION_REF`) | Nada gravado | Conforme. Na tela: 307. Por rota pública: `{}`, porque o encaminhamento interno passa pelo proxy. Sem JavaScript: 400 | P |
| CT-08 | `pending`, `admin` desativado e `viewer` em toda ação de conteúdo | `FORBIDDEN`, nada gravado | Conforme | P |
| CT-09 | `editor` em excluir, configurações e envios (N04, N05, N06) | `FORBIDDEN`, nada gravado | Conforme | P |
| CT-10 | `super_admin` nos envios (N08) | `FORBIDDEN`, nada gravado | Conforme | P |
| CT-11 | Leitor sem JavaScript | Sem redirecionamento de sucesso, nada gravado | Conforme | P |
| CT-12 | N11: `role=admin` em cookie, formulário e cabeçalho | Ignorado: `FORBIDDEN` | Conforme | P |
| CT-13 | N11: token alterado no cookie (`service_role`) | Login, nada gravado | Conforme | P |
| CT-14 | N13: sessão encerrada no servidor, com o cookie ainda no navegador | Login, nada gravado | Conforme | P |
| CT-15 | CSRF: `Origin` de outro site com a sessão do `admin` | Recusado, nada gravado | Conforme: 500 do Next, sem pilha | P |
| CT-16 | Trilha | `access.denied` sem o conteúdo do pedido | Conforme | P |

### 3.3 Rotas internas

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-17 | `/api/internal/revalidate` e `/api/internal/jobs/notificacoes`: sem token, vazio, errado, de tamanho igual, `bearer` minúsculo, `Basic`, `x-api-key`, cookie, na URL | 401, `no-store`, sem detalhe | Conforme | D |
| CT-18 | Corpo inválido com o token certo: JSON quebrado, lista, entidade desconhecida, travessia, 5.000 caracteres, objeto, `__proto__` | 400 "Corpo inválido.", sem campos do esquema | Conforme | D |
| CT-19 | Token de uma rota na outra; método errado | 401; 405 | Conforme | D |

### 3.4 API REST do Supabase, com a chave anônima

O resultado foi conferido contra a RLS em `pg_policy` e `has_table_privilege`, e não por suposição.

| Tabela | Privilégio do `anon` | Observado |
| ------ | --------------------- | --------- |
| `form_submissions`, `audit_log`, `profiles`, `role_permissions`, `ambiente_banco` | Nenhum | 401, `42501` |
| `services`, `cases`, `pages`, `ctas`, `areas`, `case_categories` | `select`, com policy de publicado | Só `published` com data vencida. Rascunho, arquivado e agendado: 0 linhas, inclusive filtrando por `id` e `status` |
| `blocks` | `select`, com policy de página publicada | Blocos de página oculta: 0 linhas |
| `media_assets` | `select`, com policy de uso publicado | Imagem só de conteúdo oculto, ou sem uso: 0 linhas |
| `service_areas`, `case_services`, `case_media`, `slug_redirects` | `select`, com policy de item publicado | Vínculos de oculto: 0 linhas |
| `site_settings` | `select` aberto | Só dados institucionais |
| Todas | Sem `insert`, `update` nem `delete` | 401, `42501`, nas 18 tabelas |

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-20 | Toda tabela exposta está classificada | Lista igual ao OpenAPI lido com a service role | Conforme | D |
| CT-21 | OpenAPI público | Não cita tabela nem função privada | Conforme | D |
| CT-22 | Embutido (join) e funções abertas | Não atravessam a RLS; `resolve_public_slug` de oculto é `null` | Conforme | D |
| CT-23 | `rpc/assign_role`, `set_profile_active`, `record_audit_event`, `save_case`, `save_service` | 401 | Conforme | D |
| CT-24 | Token forjado: `alg: none`, chave errada, lixo | 401 | Conforme | D |
| CT-25 | `editor`, `viewer`, `pending`: envios, trilha, matriz, perfil alheio | 0 linhas; matriz 403; só o próprio perfil | Conforme | D |
| CT-26 | N10: mudar o próprio papel, pela tabela e pela função | Nada muda | Conforme | D |
| CT-27 | N09: `admin` promove a `admin`/`super_admin`; `editor` e `viewer` mudam papel | Recusado. Controle: `admin` rebaixa `editor` | Conforme | D |
| CT-28 | Evento forjado na trilha; `update` e `delete` na trilha, como `admin` | Recusado | Conforme | D |

### 3.5 Storage

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-29 | Listar `media` com a chave anônima, com arquivo existente | `[]`. Controle: a service role enxerga o arquivo | Conforme | D |
| CT-30 | Enviar, substituir e apagar com a chave anônima; enviar como leitor | Recusado; arquivo intacto | Conforme | D |
| CT-31 | Tipo proibido, com a permissão de editor: HTML, SVG, EXE, JS, JSON, ZIP, `octet-stream` | `invalid_mime_type` (corpo 415; HTTP 400) | Conforme | D |

### 3.6 Conteúdo fora do ar por URL direta

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-32 | `/cases/<oculto>` e `/servicos/<oculto>`: HTML, `RSC: 1`, pré-busca e `.rsc` | 404, sem o texto do item | Conforme | D |
| CT-33 | Toda rota de `/api/v1`: detalhe 404 e lista sem o item | Conforme o esperado | Conforme | D |
| CT-34 | Sitemap, `llms.txt`, `llms-full.txt`, Home e filtros com slug oculto (`?categoria=`, `?servico=`, `?area=`, `/contato?servico=`) | Nome do item não aparece | Conforme | D |
| CT-35 | Imagem de compartilhamento de item oculto | Igual à de um endereço que não existe | Conforme | D |
| CT-36 | **Com `use cache`**: publicado, visitado (cache cheio) e arquivado pelo painel | Detalhe e API em 404 na hora; listas sem o item | Conforme | D |
| CT-36b | Toda função `use cache` chamada direto por POST, com o slug de cada item oculto (achado A-04) | Só o que está no ar; id não chega ao navegador | Conforme | D |
| CT-37 | **Fora do `use cache`**: arquivado direto no banco, sem invalidar | O proxy responde 404 no detalhe | Conforme | D |

### 3.7 Erros e arquivos

| # | Cenário | Esperado | Observado | Spec |
| - | ------- | -------- | --------- | ---- |
| CT-38 | 400 (API, `_next/image`), 401, 404 (API, página, detalhe, malformado, arquivo), 405 | Sem pilha, caminho, SQL, nome de variável ou valor de segredo | Conforme | D |
| CT-39 | 403: recusa de Server Action e `role_permissions` | Só código e mensagem | Conforme | P, D |
| CT-40 | 500 e 4xx: Server Action com origem de fora, id inexistente, id estranho, corpo quebrado | Sem pilha nem caminho | Conforme | D |
| CT-41 | 500 e 503 reais, com o banco fora do ar (seção 5) | Mensagem segura | Conforme | Manual |
| CT-42 | `Host` e `x-forwarded-host` de outro site | Redirecionamento continua relativo | Conforme | D |
| CT-43 | `/.env`, `/.git/config`, `/package.json`, `/.next/BUILD_ID`, `/supabase/config.toml`, `/_next/static/../../.env` e outros 18 | 4xx | Conforme | D |
| CT-44 | `public/`, `.next/static`, HTML e RSC pré-renderizados, HTML entregue e todo JavaScript carregado pelo navegador | Nenhum nome nem valor de segredo | Conforme: 0 ocorrências (lista abaixo) | D |

**Busca por segredos.** Nomes procurados: `SUPABASE_SERVICE_ROLE_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `RESEND`,
`CRON_SECRET`, `SUBMISSION_HASH_SECRET`, `CONTENT_REVALIDATE_SECRET`, além da declaração `"role":"service_role"`. No
build com Supabase, as variáveis estavam definidas durante o `next build`, e o teste procura também o **valor** de cada
uma. Nenhum mapa de código em `.next/static`. O teste só imprime o nome da variável e o arquivo.

## 4. Matriz de acesso observada

**FORBIDDEN** vem da guarda do servidor, e a linha fica intacta. **Controle** é o `admin`, que grava.

| Ação | Sem sessão | `pending` | desativado | `viewer` | `editor` | `super_admin` | `admin` |
| ---- | ---------- | --------- | ---------- | -------- | -------- | ------------- | ------- |
| Criar, editar, publicar, despublicar, arquivar, restaurar (5 tipos) | Login | FORBIDDEN | FORBIDDEN | FORBIDDEN | Permitido | Permitido | Controle |
| Excluir (5 tipos) | Login | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | Permitido | Controle |
| Blocos de página | Login | FORBIDDEN | FORBIDDEN | FORBIDDEN | Permitido | Permitido | Controle |
| Configurações | Login | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | Permitido | Controle |
| Status e exclusão de envio | Login | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | Controle |
| Envio de mídia | Login | FORBIDDEN | FORBIDDEN | FORBIDDEN | Permitido | Permitido | Controle |

"Permitido" não foi exercitado para `editor` e `super_admin` nesta spec: a permissão positiva deles está em
`publication-matrix.test.ts` e nas jornadas `@cms`. Papéis e permissões seguem como proposta, até a Agência Benjamin
aprovar ([ADM-01 §5](../seguranca/perfis-e-permissoes.md)).

## 5. Banco fora do ar: 500 e 503 reais

Roteiro manual, porque derruba o banco. A stack local foi parada com o site no ar.

| Pedido | Resposta | Observação |
| ------ | -------- | ---------- |
| `/`, `/sobre`, `/servicos`, `/cases`, `/contato`, `/feedback`, sitemap, `llms.txt` | 200 | Do cache, como pede o ADR-0006 |
| `/api/v1/services`, `/api/v1/settings` | 200 | Do cache |
| `/api/v1/cases`, `/api/v1/cases/nao-existe`, job de reenvio | 500 `INTERNAL_ERROR`, mensagem fixa | Ver A-08 |
| `/admin`, `/admin/leads` | 307 para o login | Sem Auth, fecha |
| `/admin/login` | 200 | |
| `/cases/nao-existe`, `/servicos/nao-existe` | 200 | Ver A-07 |
| `/rota-que-nao-existe`, `/api/v1/pages/home` | 404 | |
| `/api/v1/health` | 200 | Ver A-09 |
| Envio de formulário, com o PostgREST fora | Erro de serviço indisponível, com código de atendimento | Visto em situação real na [QA-05](qa-05-formularios.md), O-01 |

Nenhuma resposta trouxe pilha, caminho, SQL, `PGRST`, `ECONNREFUSED`, endereço do banco ou segredo. No log do servidor,
os valores de `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `CONTENT_REVALIDATE_SECRET` e `SUBMISSION_HASH_SECRET` tiveram
0 ocorrências. O 500 por origem de fora, em Server Action, está automatizado (CT-15 e CT-40).

## 6. Achados

Nenhum é violação crítica, e nenhum foi corrigido aqui: ou são decisão de produto, ou a correção não é pequena.

| # | Achado | Severidade | Passos para reproduzir | Recomendação |
| - | ------ | ---------- | ---------------------- | ------------ |
| A-01 | **Trocar a senha não pede a senha atual.** Com sessão aberta, `updatePassword` troca direto, e `secure_password_change = false` em `supabase/config.toml`. Quem está em computador compartilhado com a sessão aberta toma a conta | Média | Entrar → abrir `/admin/nova-senha` → definir outra senha | Ligar `secure_password_change` na produção (exige sessão recente) ou pedir a senha atual. Decisão da coordenação |
| A-02 | **Arquivo do bucket público abre por URL direta.** Imagem de rascunho, se alguém tiver o endereço, é baixada sem RLS. É decisão registrada em `20261027000200_media_storage_restrito.sql`: o caminho tem UUID e a listagem está fechada | Baixa | `GET /storage/v1/object/public/media/<caminho>` | Manter. Rever se entrar material sigiloso de cliente |
| A-03 | **O bucket confia no tipo declarado.** Com permissão de envio, um arquivo com script declarado como `image/png` entra no bucket se não passar pelo painel. Ele é servido como `image/png`, e o navegador não executa. A assinatura é conferida em `finalizeMediaUpload`, que não roda em envio direto à API | Baixa | Teste «o bucket respeita o tipo declarado…» | Manter. Limpeza de arquivo sem registro está em ADM-09 |
| A-04 | **Função `use cache` responde a POST anônimo, para quem tiver o id.** O Next registra essas funções como Server Actions: `POST /` com `Next-Action: <id>` e corpo `["<slug>"]` executa a função, com argumento à escolha de quem chama. **Não é vazamento:** o id só existe no manifesto do servidor e não chega ao navegador (teste), e a função só lê com a chave anônima e a RLS, então só devolve o que está no ar (teste, com rascunho, arquivado e agendado). O risco é de custo: argumentos à vontade enchem o cache, e, com outro `Content-Type`, o pedido responde 404 e dispara uma regeneração da rota, com 8 linhas de `Unexpected cache miss` no log | Baixa | `POST /` com `Next-Action: <id de $$RSC_SERVER_CACHE em .next/server/server-reference-manifest.json>` | Acompanhar em versões do Next. Não guardar nada privado em `use cache`, como já é a regra. Limite de requisição fica para a plataforma |
| A-05 | **`/api/v1/*` fica até 5 min na CDN** (`s-maxage=300`, mais `stale-while-revalidate`). Item arquivado sai do servidor na hora, como CT-36 mostra, mas a CDN pode servir a resposta anterior. **Não testado na Vercel** | Baixa | Conferir o cabeçalho `Cache-Control` | Medir em homologação (GO-02). Esta API não tem consumidor externo hoje |
| A-07 | **Com o banco fora, endereço inexistente responde 200.** `resolvePublicSlug` deixa passar quando a consulta falha, para uma indisponibilidade não derrubar páginas em cache, e a página mostra o "não encontrado" com status 200. Não mostra conteúdo oculto, a não ser que ele já estivesse no cache antes de sair do ar sem invalidar | Baixa | Parar o banco → `GET /cases/nao-existe` | Manter. É a escolha entre disponibilidade e 404 exato |
| A-08 | **`/api/v1/*` sem cache responde 500, e não o 503 do contrato** ([contratos](../api/contratos.md), "Banco indisponível"), com o banco fora. O corpo é seguro. Causa provável, não confirmada: o `AppError` lançado dentro de `use cache` perde o tipo ao atravessar o cache | Baixa | Parar o banco → `GET /api/v1/cases` | Abrir issue. A correção não é trivial, e por isso não entrou aqui |
| A-09 | **`/api/v1/health` responde 200 com o banco fora.** Diz que o site está de pé, e não que o conteúdo novo pode ser lido | Baixa | Parar o banco → `GET /api/v1/health` | Decidir em QA-11 se o monitoramento precisa conferir o banco |
| A-06 | **`cases` e `media_assets` expõem `updated_by` à chave anônima** quando publicados. É só um UUID, sem nome nem e-mail, e `profiles` é fechada | Baixa | `GET /rest/v1/cases?select=updated_by&limit=1` | Aceitar, ou retirar a coluna do `select` do `anon`, com migration própria |

## 7. As provas falham quando a proteção é retirada

As mutações foram aplicadas só no ambiente local e desfeitas em seguida. As de banco, à mão na stack; as de aplicação, num
build temporário. Depois de reverter, as baterias da seção 9 voltaram a passar.

| Mutação | Resultado |
| -------- | --------- |
| `anon` com `select` e policy aberta em `profiles` | Falha «profiles: a chave anônima recebe 401, sem nenhuma linha» |
| `anon` com `select` e policy aberta em `audit_log` | Falha «audit_log: a chave anônima recebe 401, sem nenhuma linha» |
| Policy aberta para `anon` em `cases` | Falha «cases: a chave anônima só lê o que está publicado». Detalhe, `/api/v1` e imagem de compartilhamento **seguem passando**: o repositório filtra de novo com `isPubliclyVisible`, uma segunda barreira real |
| Policy aberta para `anon` em `blocks` | Falha «blocks: nada de páginas fora do ar» |
| Bucket sem `allowed_mime_types` | Falham os 7 testes de tipo proibido |
| Policy de listagem do bucket para `anon` | Falha «o bucket não lista para a chave anônima, embora o arquivo exista» |
| Policy de `update` aberta em `profiles` | Falha o N10 |
| Nome `CRON_SECRET` e, depois, o valor da service role plantados em `.next/static` | Falha, citando o arquivo e só o nome da variável |
| `requirePermission` sem conferir o papel | Falham os 5 papéis e o N11: a resposta deixa de ser `FORBIDDEN` |
| Proxy sem redirecionar quem não tem sessão | Falham as rotas. As telas respondem 200 com o esqueleto e **nenhum conteúdo do painel**: `requirePageAccess` segura como segunda barreira |
| Rota interna devolvendo os erros do Zod | Falham os 9 testes de corpo inválido |
| Sem o aviso de nova aba no crédito e com os CTAs de volta em `/contato` | Falham «/sobre: todos os links», «/contato: todos os links» e «o botão de contato some…» |

**O teste de Server Action só vale com o formato certo.** Na primeira versão, a recusa vinha antes de ler os campos e
passava, enquanto o controle falhava: foi o controle que revelou que os campos não estavam chegando.

## 8. INT-06 — Links e CTAs

Em `tests/e2e/links-e-ctas.spec.ts`, no desktop e no celular, com o conteúdo versionado e com o banco. **Nenhuma requisição
real a sites externos**: o endereço é conferido contra `content/site.ts` e, com banco, contra o que está publicado. Os
perfis existirem de fato foi conferido à mão no [relatório da issue](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/172), em 29/10/2026, e não foi refeito aqui.

| # | Cenário | Esperado | Observado |
| - | ------- | -------- | --------- |
| CT-45 | Todo `<a>` de `/`, `/sobre`, `/areas`, `/servicos`, `/cases`, `/contato`, `/contato/projeto`, `/contato/mensagem`, `/feedback`, `/privacidade` | Interno abaixo de 400; âncora existente; nenhum `href` vazio, `#` ou `javascript:` | Conforme, **após B-01 e B-02** |
| CT-46 | Idem, em todos os detalhes de serviço e de case | Idem | Conforme |
| CT-47 | CTA para a própria página, salvo filtro e paginação | Nenhum | Conforme, **após B-02** |
| CT-48 | Externo | `https`, `target="_blank"`, `rel` com `noopener noreferrer`, rótulo de nova aba, destino conhecido | Conforme, **após B-01** |
| CT-49 | "Quero este serviço", em cada serviço | `/contato?servico=<o próprio>#formulario`, com o serviço escolhido | Conforme |
| CT-50 | CTAs da Home, conteúdo versionado | Destino de `resolveCtaHref` | Conforme |
| CT-51 | Botão de contato ao sair de `/contato` por navegação | Volta visível, com opacidade 1 | Conforme |
| CT-52 | CTA publicado no banco, interno e externo, e depois arquivado, invalidando por `/api/internal/revalidate` | Entra e sai da Home sem redeploy | Conforme |

| # | Defeito | Passos para reproduzir | Severidade | Correção | Reteste |
| - | ------- | ---------------------- | ---------- | -------- | ------- |
| B-01 | O crédito "NúcleoTech FECAP", no rodapé de todas as páginas, abria em nova aba sem avisar o leitor de tela. O relatório anterior da issue dava todos os externos como avisados | Abrir qualquer página → conferir o link do crédito | Baixa | `sr-only` no link (`site-footer.tsx`) | ✅ os 22 testes de varredura falhavam antes |
| B-02 | Em `/contato`, "Fale com a gente" (cabeçalho) e "Envie uma mensagem" (rodapé) apontavam para a própria página. O relatório anterior só olhava o `<main>` | Abrir `/contato` → clicar no botão do cabeçalho | Baixa | `contact-cta.tsx` esconde as duas chamadas em `/contato` | ✅ falhava antes (seção 7); CT-51 |

**O que falta.** O critério "alteração no painel reflete no site sem redeploy" está coberto para contato e redes
(`jornada-configuracoes-cms.spec.ts`), textos (`jornada-site-cms.spec.ts`), cases (J2.5) e, aqui, CTAs pela rota de
invalidação. A **tela** de CTAs é a ADM-11, em PR aberto, e o teste real pelo painel depende dela.

## 9. Resultado

| Bateria | Resultado em 04/11/2026 |
| ------- | ----------------------- |
| `npm run verify` | Verde: 91 arquivos e 1206 testes passando, 167 pulados (entre eles os 17 arquivos de integração, que rodam na linha abaixo); build de produção ok |
| `npx supabase test db`, banco limpo | `Files=10, Tests=260, Result: PASS` |
| `npm run test:supabase` | 17 arquivos, 165 de 165 |
| `npm run test:e2e:cms`, todas as jornadas `@cms` | 361 de 361 |
| `npm run test:e2e`, build sem Supabase, desktop e celular | 437 passaram, 0 falharam, 699 pulados (`@cms` e o que não depende da largura) |
| As specs desta entrega e as três corrigidas, `@cms`, `--repeat-each=3` | 810 de 810 |
| As specs desta entrega, sem Supabase, desktop e celular, `--repeat-each=3` | 654 passaram, 0 falharam, 1428 pulados |
| `links-e-ctas.spec.ts`, build com Supabase, sem jornadas em paralelo | 27 passaram, 7 pulados |

As mutações da seção 7 e o roteiro da seção 5 são verificações à parte, feitas uma vez. As repetições rodaram no commit
anterior, `b5b3c8c`. O último commit só acrescenta uma verificação de QA-03 e pula a varredura do build local quando o alvo é
um ambiente publicado; a parte alterada foi repetida 3 vezes, sem falha.

### Testes instáveis sob carga

`jornada-editor-cms.spec.ts` (J2.5), `home-cases-em-destaque.spec.ts` e o PDF de 8 MB de `jornada-midia-cms.spec.ts` tinham
falhado em outra frente. Para reproduzir, servidor e navegador foram presos a 2 núcleos, com 24 processos ocupando os
mesmos núcleos: carga entre 34 e 51 numa máquina de 8.

| Medida | Resultado |
| ------ | --------- |
| J2.5 como estava, 12 vezes | **0 de 12.** 10 na espera de 5 s pela confirmação da Server Action e 2 no prazo de 30 s do teste. Nenhuma por conteúdo antigo |
| J2.5 corrigida, 12 vezes, mesma carga | 12 de 12 |
| `home-cases-em-destaque` e `jornada-midia-cms` corrigidas, 3 vezes, mesma carga | 24 de 24 |
| Primeira leitura de `/cases/<slug>` logo depois de salvar, em máquina livre | Versão nova em 35 de 35 |
| Idem, sob carga, inclusive com gravações em sequência, sem pausa | Versão nova em 37 de 37 |

**Conclusão: o problema era do teste, e não há evidência de conteúdo antigo depois de publicar.** A hipótese de que a
primeira requisição depois de invalidar vem do pré-render anterior (comentário em `invalidate.ts`) **não reproduziu** em 72
medições, mas também não foi descartada: uma das falhas da outra frente foi exatamente esta, o texto novo não apareceu em
5 s, com uma única abertura, e o ADR-0006 registra 4 de 45 com a versão anterior 1 s depois. Por isso a J2.5 agora recarrega
até a versão nova, que é o que o ADR promete. Se o conteúdo antigo ficasse preso, ela falharia do mesmo jeito.

O prazo de 5 s do ADR continua valendo em máquina livre. `publishBudgetMs()` só o estende para 30 s com a carga acima do
número de núcleos, porque nessa situação o relógio mede a fila de CPU. Sob a mesma carga, o aquecimento de `invalidate.ts`
registrou `content.cache.warm_failed` 2 vezes em 12 gravações, sem efeito na leitura seguinte.


## 10. Pendências

- **Next.js:** `npm audit --omit=dev` respondeu 0 em 04/11/2026, mas a [go/no-go](../operacao/go-no-go.md) (E6) registra um
  release de segurança do Next.js, de 03/11/2026, que precisa entrar antes de publicar. Esta execução testou a versão 16.4.5.
- **Homologação:** repetir as seções 3 e 4 contra o Supabase de homologação (GO-02), com as chaves e o `config.toml` de lá.
- **PRs abertos:** prévia protegida (ADM-14), exclusão de mídia (ADM-09) e CTAs (ADM-11) entram aqui quando chegarem à
  `main`. A verificação falha sozinha para rota ou ação nova, até serem classificadas.
- **Teste de invasão independente** e limite de requisições: fora do escopo do MVP.
- **Aprovação da Benjamin** de quem acessa o quê (ADM-01 §5): os testes provam a proposta atual.
