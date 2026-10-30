# Filtros, busca e relacionamentos de conteúdo (pós-MVP)

| Campo        | Valor                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Issue        | FUT-09                                                                         |
| Responsável  | Julia Damásio (`@Juliadamassio`)                                               |
| Versão       | 0.1.0 — **rascunho de proposta de novo escopo (não faz parte do MVP)**         |
| Data         | 30/10/2026                                                                     |
| Origem       | NT-ATA-2026-003; NT-PRJ-2026-001                                               |
| Relacionadas | FUT-05 (fluxo editorial), FUT-10 (novas seções, conteúdos e cases)             |

## 1. Objetivo

Propor, como evolução **separada do MVP**, melhorias para que quem visita o site encontre cases e
serviços da Agência Benjamin com mais facilidade: busca interna com sugestões, tags de conteúdo
com vocabulário controlado e conteúdos relacionados entre cases e serviços.

Este documento **não implementa nada** e **não faz parte da entrega obrigatória de 04/11/2026**.
O resultado esperado é uma proposta com critérios de entrada, estimativa, dependências e critérios
de uso e performance, para a coordenação e a Benjamin decidirem se e quando ela entra no backlog
(aprovação como novo requisito, GOV-12).

**Fora do escopo:** novas seções do site, conteúdo enviado por terceiros e captação de pessoas
(ver seção 8).

## 2. Situação atual (ponto de partida)

Levantamento feito em 30/10/2026 sobre a `main` (commit `34b2dee`, de 29/10/2026), lendo o código
de `app/`, `components/`, `lib/`, `content/` e `supabase/migrations/`. "Não encontrado" significa
que a busca no repositório não localizou o item; o site em produção não foi testado.

### 2.1 Filtros do portfólio (`/cases`) — existem

- A página `/cases` filtra por **categoria**, **serviço**, **área** e **cliente**
  (`app/(site)/cases/page.tsx`, `components/sections/case-filters.tsx`).
- A **categoria** aparece como botões em forma de link (Todos, Copywriting, Social Media & Criação,
  Assessoria de Imprensa). **Serviço**, **área** e **cliente** aparecem como listas de seleção
  (`<select>`).
- Os filtros ficam na **URL** (`/cases?categoria=…&servico=…&area=…&cliente=…`), o que permite
  compartilhar o link de uma busca filtrada.
- O formulário usa o método GET e funciona **mesmo sem JavaScript** no navegador (comentário em
  `case-filters.tsx`).
- Os valores recebidos pela URL são validados: categoria, serviço e área precisam ser um *slug*
  válido, e o cliente só é aceito se existir na lista de clientes dos cases. O texto digitado na
  URL não é repetido na página.
- Abaixo dos filtros, a página informa a contagem ("1 case encontrado" ou "N cases encontrados").
- O filtro é aplicado por `listCases` (`lib/server/content/repository.ts`) comparando campos
  exatos. Só itens publicados e visíveis são devolvidos, ordenados pelo campo `order` do conteúdo
  e, em caso de empate, por título (`lib/domain/content/visibility.ts`). A função usa cache de
  nível "hours".
- A API pública `GET /api/v1/cases` também aceita filtros e tem paginação
  (`app/api/v1/cases/route.ts`).

### 2.2 Quando nenhum case corresponde — existe, de forma simples

- A página mostra a mensagem "Nenhum case com esses filtros por enquanto. Tente outra
  combinação." e um link "Limpar filtros e ver todos os cases" (`app/(site)/cases/page.tsx`).
- **Não mostra** sugestões de projetos nesse estado.
- Já existe a função `listFeaturedCases` (`repository.ts`), que devolve cases marcados como
  destaque (`featured`). Ela é uma base possível para exibir "Projetos em destaque" quando não há
  resultado; a viabilidade precisa ser confirmada na estimativa.

### 2.3 Tags de conteúdo — não encontrado

- Não há campo de tags no modelo de um case (`lib/domain/content/types.ts`: categoria, serviços,
  cliente e tipo de entrega) nem nas migrations do banco (`supabase/migrations`).
- A palavra "tag" no código se refere a **cache tags** do Next.js
  (`lib/server/content/cache-tags.ts`), que servem para atualizar páginas em cache e não
  classificam conteúdo.
- Hoje a classificação é feita por **categorias** (3, editadas no painel do CMS) e por **serviços**.
  Essa é a única taxonomia controlada que existe.

### 2.4 Busca por texto e sugestões ao digitar — não encontrado

- Não há campo de busca livre no site; os filtros são só categoria, serviço, área e cliente.
- Não foram encontrados autocomplete, índice de busca de texto no banco (como `tsvector`) nem
  parâmetro de busca na API de cases.

### 2.5 Conteúdos relacionados — existem, por regras simples

- **Detalhe do case** (`app/(site)/cases/[slug]/page.tsx`): seção "Mais cases de [categoria]", com
  até **3** cases da **mesma categoria**, sem repetir o case atual. Não considera serviço, área,
  cliente nem tags.
- **Detalhe do serviço** (`app/(site)/servicos/[slug]/page.tsx`): seção "Cases com [serviço]".
- **Página de áreas** (`app/(site)/areas/page.tsx`): mostra os serviços relacionados a cada área.
- A API pública de serviços (`/api/v1/services/[slug]`) devolve os cases relacionados.

### 2.6 Volume atual de conteúdo

- O arquivo de conteúdo inicial (`content/cases.ts`) contém **3 cases** (Aventura de Construir,
  Meridiano e FECAP) e 3 categorias. Esse número vale para o conteúdo inicial do repositório; o
  volume real de produção pode ser diferente e deve ser confirmado com a Benjamin.

### 2.7 O que esta seção não afirma

- Não foi medido o desempenho (Lighthouse, tempo de resposta) das páginas atuais.
- Não foi verificado o conteúdo publicado em produção.

## 3. Escopo proposto

Cinco funcionalidades, que podem ser aprovadas e entregues em fases independentes:

| ID | Funcionalidade | Problema do visitante que resolve | Prioridade |
| -- | -------------- | --------------------------------- | ---------- |
| F1 | **Zero resultados com destaques:** quando os filtros ou a busca não retornam nada, manter a mensagem atual e exibir até 3 projetos em destaque | Hoje a pessoa vê só uma mensagem e precisa recomeçar; com destaques ela continua navegando | Alta |
| F2 | **Busca por texto** em cases e serviços (título, resumo, cliente), combinável com os filtros atuais, via parâmetro na URL | Quem procura "assessoria de imprensa FECAP" não consegue digitar o que quer; precisa adivinhar em qual filtro está | Alta |
| F3 | **Sugestões ao digitar (autocomplete):** a partir de 2 caracteres, sugerir títulos de cases e serviços publicados antes de apertar Enter | Reduz tentativa e erro na busca | Baixa a média (ver seção 4: exige JavaScript novo) |
| F4 | **Tags de conteúdo com vocabulário controlado:** lista fechada, criada só por quem administra o painel, em dois grupos: *entregáveis* (ex.: `SocialMedia`, `MediaTraining`, `Branding`, `PressRelease`) e *ferramentas* (ex.: `Photoshop`, `Illustrator`, `RDStation`) | Hoje só existem categorias e serviços; não é possível ver "todos os trabalhos feitos com Branding". A lista fechada evita tags duplicadas ou escritas de formas diferentes | Média |
| F5 | **Relacionados melhores:** além da categoria, relacionar cases por serviço em comum e, depois da F4, por tags em comum | A regra atual só olha a categoria (até 3 cases da mesma categoria) | Média |

Os nomes de tags acima são **exemplos propostos**. A lista inicial e quem a mantém precisam ser
decididos com a Benjamin (seção 5).

**Fases sugeridas:** A (F1 + F2, sem JavaScript novo), B (F4 + F5) e C (F3, só se os critérios da
seção 4 forem atendidos). Cada fase pode ser aprovada separadamente.

**Fora do escopo desta proposta:** ver seção 8.

## 4. Critérios de uso e performance

Os valores numéricos abaixo são **propostos** e devem ser confirmados na aprovação.

| # | Critério | Como verificar | Vale para |
| - | -------- | -------------- | --------- |
| 1 | A busca e os filtros continuam funcionando **sem JavaScript**, como o formulário atual de filtros | Teste manual com JavaScript desligado e teste E2E | F2 |
| 2 | O Lighthouse mobile das páginas afetadas permanece **≥ 90** (meta do projeto, QA-07) | Relatório do Lighthouse anexado ao PR | F1 a F5 |
| 3 | Uma busca sem resultado **nunca** deixa a página vazia: mostra mensagem, link para limpar e até **3** destaques | Teste automatizado do estado vazio | F1 |
| 4 | Só **conteúdo publicado** aparece em resultados, sugestões e relacionados, com as mesmas regras de visibilidade do site | Teste de unidade e conferência com conteúdo em rascunho | F1 a F5 |
| 5 | O termo digitado é limitado em tamanho (proposta: 80 caracteres), validado e nunca refletido na página sem tratamento | Teste de unidade da validação | F2, F3 |
| 6 | Sugestões aparecem a partir de **2 caracteres**, em no máximo **5** itens, e respondem em até **300 ms** (percentil 95, em ambiente de preview) | Medição no ambiente de preview | F3 |
| 7 | O autocomplete é operável por **teclado** e **leitor de tela** (padrão de acessibilidade para campo com sugestões) | Teste manual com teclado e leitor de tela; teste E2E | F3 |
| 8 | Tags seguem **vocabulário fechado**: só quem administra o painel cria, e uma tag sem conteúdo publicado não aparece para o visitante | Teste de permissão (RBAC) e de visibilidade | F4 |
| 9 | Os termos buscados **não são guardados** sem decisão de privacidade aprovada | Revisão do PR e do desenho | F2, F3 |
| 10 | A API pública mantém compatibilidade com os contratos atuais; parâmetros novos são opcionais | Testes de contrato existentes + novos | F2, F4 |

## 5. Dependências e decisões a confirmar

### 5.1 Dependências

O backlog original da FUT-09 **não registra dependências**, e a issue recomenda consultar o
responsável antes de presumir que não há. Pela análise do repositório, a implementação tocaria:

- **Modelo de conteúdo e validação:** `lib/domain/content` (tipos e esquemas), para o campo de tags.
- **Banco de dados:** migration versionada em `supabase/migrations/` com RLS e plano de rollback
  (regra do `AGENTS.md`), para a tabela de tags e o vínculo com cases. Nada é aplicado em produção
  sem instrução explícita do responsável.
- **CMS:** formulários de cases (e uma tela de tags) no painel, com permissões no RBAC e auditoria.
- **API pública:** novos parâmetros opcionais em `/api/v1/cases` e `/api/v1/services`, mantendo a
  compatibilidade (`docs/api/contratos.md`).
- **Cache e invalidação:** `lib/server/content/cache-tags.ts` e `invalidate.ts` (ADR-0006), para
  que novas tags e buscas respeitem o cache atual.
- **Documentação:** atualizar a wiki e `docs/api/contratos.md` quando houver implementação.

Itens do roadmap a conferir com a coordenação: **FUT-10** (novas seções e cases), **FUT-06**
(analytics, caso se queira medir termos buscados) e **FUT-05** (fluxo editorial, caso tags passem
por aprovação).

### 5.2 Decisões da Benjamin e da coordenação

1. Quem cria e mantém as tags, e qual é a **lista inicial** de entregáveis e ferramentas?
2. Com o volume atual de conteúdo (o conteúdo inicial tem 3 cases), busca e sugestões já compensam,
   ou a fase A basta por enquanto?
3. Como definir "projetos em destaque" para a F1: usar o campo de destaque que já existe nos cases?
4. A busca deve incluir também serviços e áreas, ou só cases?
5. Os termos buscados podem ser registrados para análise? Se sim, isso exige revisão de privacidade
   (SEG-02).

## 6. Estimativa

**Estimativa preliminar**, por analogia com os outros itens do roadmap (a FUT-01 estima 70–94 h).
Não foi medida em código; deve ser refinada depois das decisões da seção 5.2.

| Bloco | Horas |
| ----- | ----- |
| F1 — Zero resultados com destaques | 3–5 |
| F2 — Busca por texto (regra, repositório, tela, API) | 10–16 |
| F3 — Sugestões ao digitar, incluindo acessibilidade | 12–18 |
| F4 — Tags (migration, RLS, CMS, API, conteúdo inicial) | 20–28 |
| F5 — Relacionados por serviço e tags | 6–10 |
| Testes (unidade, E2E) e documentação | 10–14 |
| **Total** | **61–91 h** |

Por fase: A (F1 + F2) é a menor e mais independente; B (F4 + F5) concentra o trabalho de banco e
CMS; C (F3) só vale se a Benjamin confirmar a necessidade e os critérios da seção 4 forem atendidos.

## 7. Critérios de entrada e aprovação necessária antes de implementar

- [ ] Benjamin confirma a necessidade e as decisões da seção 5.
- [ ] Coordenação aprova o novo escopo e a estimativa (GOV-12).
- [ ] Priorização no backlog pós-MVP.

## 8. Ideias para outras evoluções (fora desta proposta)

Ideias levantadas durante a análise que **não pertencem à FUT-09**. A classificação abaixo é uma
sugestão; quem decide é a coordenação (GOV-12).

| Ideia | Onde pode caber | Observação |
| ----- | --------------- | ---------- |
| Portfólio dinâmico e comercial, além de filtros e busca | FUT-10 (novas seções e cases); parte comercial relacionada à FUT-01 (CRM) | A FUT-09 cobre só encontrar conteúdo |
| Blog de tendências feito pelos próprios alunos | FUT-10 (nova seção) e FUT-05 (revisão antes de publicar) | Exige fluxo de autoria e aprovação |
| Experiências e imagens de quem já viveu os eventos | FUT-05 e revisão de privacidade (SEG-02) | Conteúdo de terceiros, com imagem e dados pessoais (LGPD) |
| Aba ou botão "fazer parte do projeto" | A classificar (novo requisito) | É captação de pessoas, não busca de conteúdo; precisa definir quem recebe e como |
| Sugestões de eventos e de melhorias | A esclarecer com a Benjamin | Não há requisito registrado sobre eventos nas fontes consultadas |

## 9. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Autocomplete aumenta o JavaScript e reduz a nota do Lighthouse mobile | Fase C separada, com critérios 2 e 6 da seção 4; começar por busca sem JavaScript novo |
| Tags viram bagunça (duplicadas ou escritas de formas diferentes) | Vocabulário fechado, criação só por quem administra e revisão periódica da lista |
| Busca retornar conteúdo em rascunho ou não publicado | Mesma regra de visibilidade do site, com teste automatizado (critério 4) |
| Termo digitado refletido na página ou usado em consulta sem validação | Limite de tamanho, validação e tratamento do texto (critério 5) |
| Registrar termos buscados sem base de privacidade | Não guardar por padrão; só com decisão aprovada e revisão SEG-02 (critério 9) |
| Pouco conteúdo hoje: recurso grande para um portfólio pequeno | Fase A primeiro; fases B e C só com confirmação da necessidade |
| Estimativa imprecisa | Estimativa marcada como preliminar e revista após as decisões da seção 5.2 |
