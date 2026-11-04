# Matriz de testes alinhada aos critérios de aceite

| Campo        | Valor                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| Issue        | QA-01 (#179)                                                                           |
| Responsável  | Rafael Morais Rocha (conforme `ownership-por-issue.csv`; backup: Julia Damásio)        |
| Versão       | 1.2.0                                                                                  |
| Data         | 04/11/2026                                                                             |
| Base         | Commit `6bc0f72` da `main`, mais os testes de conteúdo; seção 5 com FORM-08; seções 2 a 11 revistas com QA-03, QA-05, QA-06 e INT-06, sobre `6959c27`; [critérios de aceite](../gestao/criterios-de-aceite.md) (GOV-13) |
| Relacionados | [Jornadas E2E](jornadas-e2e.md) (TECH-12), [CRUD do CMS](qa-04-cms.md) (QA-04), [homologação](homologacao.md) (QA-08), [go/no-go](../operacao/go-no-go.md) (TECH-14) |

> Esta matriz diz **quais testes existem** para cada critério, e não que o critério foi atendido. Isso
> cabe à QA-09, à TECH-14 e à GO-07. Onde não há teste automatizado está escrito **sem cobertura**.

## 1. Como ler

Os testes aparecem como caminho do arquivo › «nome do teste», com o nome exato. O mesmo nome pode se repetir em um
arquivo para vários itens (por exemplo, um por serviço).

| Bateria | Comando | Roda na `verify`? | Precisa de |
| ------- | ------- | ------------------ | ----------- |
| **U** | `npm test` | Sim | Nada |
| **S** | `npm run test:supabase` | Não (aparece como ignorado) | Supabase local |
| **D** | `npx supabase test db` (pgTAP) | Não | Supabase local |
| **E** | `npm run test:e2e` (desktop 1280×720 e Pixel 7, 412×839) | Não | Build e Chrome |
| **C** | `npm run test:e2e:cms` (tag `@cms`, só desktop) | Não | Supabase local e Chrome |
| **G** | `npm run check:release-content` | Não; está na `release:check` | Nada |

Classes de cenário: **P** positivo, **N** negativo, **B** borda.

| Situação | Significado |
| -------- | ------------ |
| Coberto | Há teste automatizado para o positivo, o negativo e as bordas do que o critério pede, em ambiente local |
| Parcial | Há teste para uma parte; a linha **Lacuna** diz o que falta |
| Sem cobertura | Nenhum teste automatizado. Se houver verificação manual prevista, ela é citada, mas não conta como teste |

## 2. Resumo por critério

Tipo: `T` técnico, `I` institucional.

| Critério | Tipo | Situação | Principal lacuna |
| -------- | ---- | --------- | ------------------ |
| [CA-01](#ca-01) Home | T + I | Parcial | Áreas e serviços na Home com conteúdo; aceite da agência |
| [CA-02](#ca-02) Sobre | T + I | Parcial | Aceite do texto (CON-03) |
| [CA-03](#ca-03) Seis áreas | T + I | Parcial | Aceite do texto (CON-04) |
| [CA-04](#ca-04) Links e 404 | T | Coberto | — |
| [CA-05](#ca-05) Redes sociais | T + I | Parcial | Confirmação de que os perfis são os oficiais |
| [CA-06](#ca-06) Responsivo | T | Coberto | Em aparelho físico e Safari, só na homologação |
| [CA-07](#ca-07) Acessibilidade | T | Parcial | Contraste AA, Lighthouse e leitor de tela real |
| [CA-08](#ca-08) SEO básico | T | Parcial | Rich Results e indexação em produção |
| [CA-09](#ca-09) Nove serviços | T + I | Parcial | Textos finais (CON-05); o gate falha hoje |
| [CA-10](#ca-10) CTA do serviço | T | Coberto | — |
| [CA-11](#ca-11) Cases | T + I, condicionado | Parcial | Material real (CON-06 a CON-08) |
| [CA-12](#ca-12) Filtros | T | Parcial | Filtros de serviço, área e cliente no navegador |
| [CA-13](#ca-13) Case sem material | T | Parcial | A plataforma não sabe o que foi autorizado; o gate falha hoje |
| [CA-14](#ca-14) Formulários | T | Coberto | — |
| [CA-15](#ca-15) Entrega do e-mail | T + I | Parcial | Envio real pelo Resend ao destinatário real |
| [CA-16](#ca-16) Duplicidade e falhas | T | Coberto | — |
| [CA-17](#ca-17) Aviso de privacidade | T + I | Parcial | Texto validado (SEG-02) |
| [CA-18](#ca-18) Login e sessão | T | Parcial | Logout, renovação de sessão, cadastro público desligado |
| [CA-19](#ca-19) Permissões N01 a N13 | T | Coberto | Repetir em homologação (GO-02) |
| [CA-20](#ca-20) Autonomia da Benjamin | I | Sem cobertura | Só homologação |
| [CA-21](#ca-21) Rascunho e publicação | T | Coberto | — |
| [CA-22](#ca-22) Upload de imagem | T | Coberto | — |
| [CA-23](#ca-23) Leads só para `admin` | T | Parcial | Tela FORM-09 e `lead.viewed` em fluxo real |
| [CA-24](#ca-24) Produção isolada | T | Parcial | Isolamento real de projetos e chaves |
| [CA-25](#ca-25) Domínio e HTTPS | T, condicionado | Sem cobertura | Conferência manual (GO-03) |
| [CA-26](#ca-26) Backup e restauração | T | Parcial | Primeira cópia real de produção |
| [CA-27](#ca-27) Release e rollback | T | Sem cobertura | É revisão de documento (GO-01) |
| [CA-28](#ca-28) `verify` e sem provisório | T | Parcial | O gate falha hoje, com 20 itens |
| [CA-29](#ca-29) Smoke pós-publicação | T | Sem cobertura | Roteiro manual (QA-11); health sem teste |

## 3. Páginas públicas

### CA-01

Home com manifesto, apresentação, áreas, serviços e cases em destaque e CTAs para Serviços, Cases, Sobre e Contato.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 01.1 | P | Bloco "Quem é a Benjamin" apresenta a agência e leva a Sobre | `tests/e2e/home-quem-e-a-benjamin.spec.ts` › «apresenta a agência e a ligação com a FECAP, sem rolagem lateral»; «leva à página Sobre, também pelo teclado». `components/sections/about-preview.test.ts` › «mostra apresentação, proposta, atuação e entregas com o texto da configuração» | E, U |
| 01.2 | P | Cases em destaque levam ao detalhe e ao portfólio | `tests/e2e/home-cases-em-destaque.spec.ts` › «cada card tem imagem, resumo e leva ao detalhe do case»; «a chamada leva ao portfólio completo, também pelo teclado» | E |
| 01.3 | P | CTAs do topo apontam para Contato e Serviços | `lib/server/content/repository.test.ts` › «resolve links dos CTAs da Home» | U |
| 01.4 | P | Manifesto vem do painel | `tests/e2e/jornada-site-cms.spec.ts` › «manifesto em rascunho não aparece; publicado, vira o topo da Home» | C |
| 01.5 | N | Rascunho marcado como destaque não aparece | `tests/e2e/home-cases-em-destaque.spec.ts` › «rascunho marcado como destaque não aparece na Home» | C |
| 01.6 | B | Banco vazio: cada lista explica o motivo | `app/(site)/banco-vazio.test.ts` › «Home explica cada lista vazia e não mostra contagem zerada» | U |
| 01.7 | B | Até 6 cases em destaque; nenhum, sem erro | `lib/server/content/repository.supabase.test.ts` › «cases em destaque da Home: só os publicados e marcados, no máximo 6 (HOME-04)»; «sem nenhum case em destaque, a lista da Home vem vazia, sem erro (HOME-04)» | U |
| — | Lacuna | Áreas e serviços listados na Home com conteúdo: **sem cobertura**. Aceite da agência: **sem cobertura**, verificação na homologação | | |

### CA-02

Página Sobre: agência experimental, proposta, modelo de atuação, relação com a FECAP.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 02.1 | P | Conteúdo principal e ligação com a FECAP | `tests/e2e/pagina-sobre.spec.ts` › «apresenta a agência experimental e a relação com a FECAP, sem rolagem lateral» | E |
| 02.2 | P | Pilares em ordem, com título e texto | `tests/e2e/sobre-proposta-de-valor.spec.ts` › «os três pilares aparecem na ordem, cada um com título e texto». `app/(site)/sobre/pilares.test.ts` › «mostra o texto vindo da configuração, na ordem da seção» | E, U |
| 02.3 | P | Texto publicado no painel muda Sobre e a Home | `tests/e2e/jornada-site-cms.spec.ts` › «Sobre publicado muda a página Sobre e o bloco Quem é a Benjamin da Home» | C |
| 02.4 | P | Próximos passos levam ao formulário certo | `tests/e2e/pagina-sobre.spec.ts` › «os próximos passos levam ao formulário certo» | E |
| 02.5 | N | Texto antigo não sobra quando o conteúdo muda | `app/(site)/sobre/pilares.test.ts` › «nenhum texto antigo fica para trás quando o conteúdo muda» | U |
| 02.6 | B | Banco vazio esconde a seção de áreas | `app/(site)/banco-vazio.test.ts` › «Sobre esconde a seção de áreas em vez de deixá-la em branco» | U |
| 02.7 | B | Despublicar devolve os textos anteriores | `tests/e2e/jornada-site-cms.spec.ts` › «despublicar devolve os textos anteriores, e o site não quebra» | C |
| — | Lacuna | Aceite do texto (CON-03): **sem cobertura**, verificação na homologação | | |

### CA-03

Seis áreas de atuação com descrição e serviços relacionados.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 03.1 | P | Estrutura com seis áreas | `content/content.test.ts` › «segue a estrutura do MVP: 6 áreas, 9 serviços, 3 categorias e 3 cases» | U |
| 03.2 | P | Cada área publicada, na ordem, com os serviços dela | `content/itens-do-mvp.test.ts` › «existe, está publicada e na posição combinada»; «lista os serviços que nascem dela» | U |
| 03.3 | P | Cada área cumpre as regras do painel | `content/itens-do-mvp.test.ts` › «cumpre as regras de publicação do painel (ADM-07) e usa ícone oficial» | U |
| 03.4 | P | Detalhe traz os serviços em ordem | `lib/server/content/repository.test.ts` › «traz a área publicada e os serviços dela em ordem» | U |
| 03.5 | P | `/areas` abre sem elemento escondido nem erro | `tests/e2e/motion.spec.ts` › «/areas: tudo visível, imagens carregadas, sem overflow nem erro» | E |
| 03.6 | N | Área em rascunho não aparece | `tests/integration/supabase/areas-servicos.test.ts` › «área em rascunho não aparece» | S |
| 03.7 | B | Banco vazio não mostra navegação vazia | `app/(site)/banco-vazio.test.ts` › «Áreas não mostra navegação vazia» | U |
| 03.8 | B | Título "Seis áreas" confere com as seis listadas | `tests/e2e/pagina-sobre.spec.ts` › «a quantidade de áreas confere com o título da seção» | E |
| — | Lacuna | Texto aprovado (CON-04): **sem cobertura**. O teste `content/itens-do-mvp.test.ts` › «segue provisória até a aprovação (CON-05)» só confirma que continua provisório. Os títulos de Home, Sobre e Áreas têm "Seis" escrito no código: com uma sétima área ficariam errados, sem teste que avise antes | | |

### CA-04

Menu, rodapé, breadcrumbs e links internos sem 404; rota inexistente retorna HTTP 404.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 04.1 | P | Rotas do sitemap respondem 200 | `tests/e2e/seo-e-compartilhamento.spec.ts` › «cada rota do sitemap tem título, descrição, canonical e preview com imagem válida» | E |
| 04.2 | P | Link do rodapé e trilha | `tests/e2e/rodape.spec.ts` › «os links internos levam às páginas certas». `tests/e2e/pagina-sobre.spec.ts` › «a trilha leva de volta ao início» | E |
| 04.3 | P | Saídas da página 404 | `tests/e2e/pagina-nao-encontrada.spec.ts` › «"Voltar ao início" leva a uma página que existe»; «"Ver serviços" leva a uma página que existe»; «"Ver cases" leva a uma página que existe» | E |
| 04.4 | P | Volta do case para o portfólio | `tests/e2e/detalhe-do-case.spec.ts` › «o caminho de volta para o portfólio funciona» | E |
| 04.5 | N | Rota, serviço e case inexistentes respondem 404 | `tests/e2e/pagina-nao-encontrada.spec.ts` › «/rota-que-nao-existe responde 404 com a identidade da marca»; «/servicos/servico-inexistente responde 404 com a identidade da marca»; «/cases/case-inexistente responde 404 com a identidade da marca». `tests/e2e/seo-e-compartilhamento.spec.ts` › «página inexistente responde 404 e não pede indexação» | E |
| 04.6 | N | Slug malformado ou de outro tipo | `lib/server/content/published-slugs.test.ts` › «recusa slug inexistente, mal formatado, reservado ou de outro tipo (404)» | U |
| 04.7 | B | Maiúsculas redirecionam, mantendo a query | `tests/e2e/jornada-visitante.spec.ts` › «endereço com maiúsculas responde 301 para as minúsculas, mantendo a query (DB-08)» | E |
| 04.8 | B | Endereço antigo leva ao novo | `lib/server/content/published-slugs.test.ts` › «endereço antigo vai para o atual (301)». `tests/integration/supabase/slugs-e-urls.test.ts` › «editor publica e troca o endereço; o antigo leva ao novo» | U, S |
| 04.9 | P | Todo link das rotas públicas e dos detalhes responde abaixo de 400, com âncora existente | `tests/e2e/links-e-ctas.spec.ts` › «/: todos os links»; «/sobre: todos os links»; «/areas: todos os links»; «/servicos: todos os links»; «/cases: todos os links»; «/contato: todos os links»; «/feedback: todos os links»; «/privacidade: todos os links»; «/servicos: cada detalhe tem os links certos»; «/cases: cada detalhe tem os links certos» | E |
| 04.10 | N | CTA não aponta para a própria página, salvo filtro e paginação | `tests/e2e/links-e-ctas.spec.ts`, nos mesmos testes. «o botão de contato some em /contato e volta, visível, ao navegar para outra página» | E |
| 04.11 | P | Destino de cada CTA | `tests/e2e/links-e-ctas.spec.ts` › «cada serviço leva ao formulário com ele mesmo escolhido»; «os CTAs da Home vão para o destino cadastrado» | E |

### CA-05

Redes sociais oficiais (Instagram, TikTok, LinkedIn) corretas, abrindo em nova aba.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 05.1 | P | Três links com https e nova aba, avisando o leitor de tela | `components/layout/site-footer.test.ts` › «os três links oficiais usam https e abrem em nova aba, avisando o leitor de tela» | U |
| 05.2 | P | No navegador: domínio certo, nova aba, teclado e área de toque | `tests/e2e/rodape.spec.ts` › «redes sociais são alcançáveis pelo teclado, com área de toque adequada» | E |
| 05.3 | N | URL sem parâmetros de rastreamento | `content/content.test.ts` › «redes sociais oficiais usam https e não carregam parâmetros de rastreamento» | U |
| 05.4 | B | Só a rede informada; sem nenhuma, sem lista vazia | `components/layout/site-footer.test.ts` › «mostra só a rede informada, e sem nenhuma não deixa lista vazia» | U |
| — | Lacuna | Que os perfis são mesmo os da agência, e que o link abre: **sem cobertura**, verificação na homologação | | |

### CA-06

Responsivo em 360, 768, 1280 e 1920 px, sem rolagem horizontal.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 06.1 | P | Páginas sem estouro, em 1280 e 412 px | `tests/e2e/motion.spec.ts` › «/: tudo visível, imagens carregadas, sem overflow nem erro»; «/sobre: tudo visível, imagens carregadas, sem overflow nem erro»; «/servicos: tudo visível, imagens carregadas, sem overflow nem erro»; «/servicos/copywriting: tudo visível, imagens carregadas, sem overflow nem erro»; «/cases: tudo visível, imagens carregadas, sem overflow nem erro»; «/cases/meridiano: tudo visível, imagens carregadas, sem overflow nem erro»; «/contato: tudo visível, imagens carregadas, sem overflow nem erro»; «/feedback: tudo visível, imagens carregadas, sem overflow nem erro»; «/privacidade: tudo visível, imagens carregadas, sem overflow nem erro» | E |
| 06.2 | P | Grade e pilares mudam com a largura | `tests/e2e/portfolio.spec.ts` › «a grade acompanha a largura da tela, sem rolagem lateral». `tests/e2e/sobre-proposta-de-valor.spec.ts` › «lado a lado no desktop, empilhados no celular, sem rolagem lateral» | E |
| 06.3 | N | Blocos e estados sem rolagem lateral | `tests/e2e/rodape.spec.ts` › «não causa rolagem lateral». `tests/e2e/home-cases-em-destaque.spec.ts` › «não causa rolagem lateral». `tests/e2e/pagina-nao-encontrada.spec.ts` › «funciona pelo teclado e sem rolagem lateral». `tests/e2e/estados-globais.spec.ts` › «filtro sem resultado explica o que houve e oferece limpar, sem rolagem lateral» | E |
| 06.4 | P | Rotas públicas em 360, 768, 1280 e 1920 px: rolagem, sobreposição, texto cortado, mídia e alvos de toque | `tests/e2e/responsividade-site.spec.ts` › «/ em 360 px» e as demais combinações de rota e largura; «detalhe de servico em 360 px»; «todo detalhe de servico em 360 px»; «todo detalhe de case em 360 px» | E |
| 06.5 | N | A medição aponta cada defeito plantado | `tests/e2e/responsividade-site.spec.ts` › «a medição enxerga o que procura: cada defeito plantado é apontado» | E |
| 06.6 | B | Menu em tela baixa e formulário com erros | `tests/e2e/responsividade-site.spec.ts` › «menu em 800 × 360 (celular deitado): todos os destinos são alcançáveis»; «/feedback: com os erros na tela, o formulário continua cabendo em 360 px» | E |
| 06.7 | B | Rolagem lateral a cada quadro, durante a animação, com CPU limitada | `tests/e2e/responsividade-site.spec.ts` › «/ com CPU 6x: nunca rola para o lado» | E |
| 06.8 | P | Painel em 360, 768 e 1280 px | `tests/e2e/painel-responsivo.spec.ts` › «administrador: inicio»; «toda tela de app/admin está na verificação de largura» | C |

Registro da execução: [QA-03](qa-03-responsividade.md). Aparelho físico e Safari ficam para a homologação.

### CA-07

Acessibilidade: teclado, foco visível, rótulos, contraste AA, `alt`.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 07.1 | P | Foco visível nos cards | `tests/e2e/portfolio.spec.ts` › «o foco do teclado fica visível no card de case»; «o foco do teclado fica visível no card de serviço» | E |
| 07.2 | P | Operar pelo teclado | `tests/e2e/estados-globais.spec.ts` › «o limpar filtros funciona pelo teclado». `tests/e2e/motion.spec.ts` › «o conteúdo que recebe foco por teclado é revelado» | E |
| 07.3 | P | Títulos e anúncios para leitor de tela | `components/sections/about-preview.test.ts` › «os tópicos são títulos reais, para quem navega por leitor de tela». `components/ui/states.test.ts` › «carregamento é anunciado por leitor de tela, e a animação fica escondida dele». `app/(site)/cases/[slug]/detalhe.test.ts` › «link externo abre em nova aba e avisa o leitor de tela» | U |
| 07.4 | N | Campo inválido recebe o foco | `tests/e2e/jornada-visitante.spec.ts` › «negativo: campos inválidos mostram erros e focam o primeiro campo» | E |
| 07.5 | N | Publicar imagem sem `alt` é recusado | `lib/domain/content/integrity.test.ts` › «R12 — imagem publicada exige texto alternativo». `lib/domain/content/case-schema.test.ts` › «exige texto alternativo em capa e galeria» | U |
| 07.6 | B | Movimento reduzido | `tests/e2e/motion.spec.ts` › «/: sem tela de carregamento, sem motor e com tudo visível na hora»; «/servicos: sem tela de carregamento, sem motor e com tudo visível na hora»; «/cases: sem tela de carregamento, sem motor e com tudo visível na hora» | E |
| 07.7 | B | Sem JavaScript e com falha do motor de animação | `tests/e2e/motion.spec.ts` › «todo o conteúdo aparece, sem tela de carregamento»; «o temporizador libera o conteúdo» | E |
| 07.8 | B | Rótulo vazio não vira referência quebrada | `components/sections/page-blocks.test.ts` › «título opcional ausente não deixa aria-labelledby apontando para o vazio» | U |
| — | Lacuna | Contraste AA, Lighthouse e uso com leitor de tela real: **sem cobertura** (SEG-07, QA-07). O critério pede Lighthouse ≥ 95, e o item E14 do go/no-go pede ≥ 90 no celular: alinhar | | |

### CA-08

SEO básico: título e descrição por página, canonical, Open Graph, sitemap, robots, JSON-LD.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 08.1 | P | Cada rota com metadados, preview e JSON-LD válido | `tests/e2e/seo-e-compartilhamento.spec.ts` › «cada rota do sitemap tem título, descrição, canonical e preview com imagem válida» | E |
| 08.2 | P | Metadados e dados estruturados | `lib/server/seo.test.ts` › «define canonical, Open Graph e Twitter da página». `lib/domain/seo/structured-data.test.ts` › «Organization traz redes oficiais, FECAP e endereço»; «BreadcrumbList numera e monta URLs absolutas»; «Service e CreativeWork apontam para a organização» | U |
| 08.3 | P | Produção indexa o site, nunca o painel | `app/robots.test.ts` › «produção: indexa o site, nunca o painel nem as APIs internas, e aponta o sitemap» | U |
| 08.4 | N | Fora de produção nada é indexado | `tests/e2e/seo-e-compartilhamento.spec.ts` › «fora de produção nada é indexado». `app/robots.test.ts` › «demais ambientes: bloqueia tudo e não divulga o sitemap». `lib/server/seo.test.ts` › «não indexa fora de produção (ambiente de teste = development)» | E, U |
| 08.5 | N | Sitemap sem painel, API nem conteúdo fora do ar | `tests/e2e/seo-e-compartilhamento.spec.ts` › «o sitemap não lista painel, API nem conteúdo fora do ar» | E |
| 08.6 | B | URLs de imagem no sitemap | `app/sitemap.test.ts` › «capa do Storage mantém a URL absoluta, sem o domínio do site na frente»; «case sem capa não declara imagem»; «toda URL é válida e usa o domínio do site» | U |
| — | Lacuna | Rich Results Test e indexação no domínio real: **sem cobertura**, verificação manual (QA-07) | | |

## 4. Serviços e cases

### CA-09

Os 9 serviços oficiais cadastrados e publicados com descrição final.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 09.1 | P | Os nove existem e cumprem as regras do painel | `content/content.test.ts` › «segue a estrutura do MVP: 6 áreas, 9 serviços, 3 categorias e 3 cases». `content/itens-do-mvp.test.ts` › «existe, está publicado e cumpre as regras de publicação do painel (ADM-06)»; «pertence às áreas combinadas, todas publicadas» | U |
| 09.2 | P | Publicado no painel, o visitante vê | `tests/integration/supabase/cms-servicos.test.ts` › «publicado, o visitante vê o serviço com imagem e só a área publicada» | S |
| 09.3 | N | Não publica incompleto ou sem área | `lib/domain/content/service-schema.test.ts` › «publicar exige resumo, descrição e ao menos uma área (R03)». `lib/server/cms/services.test.ts` › «publicar sem área é bloqueado (R03); com área publicada, publica» | U |
| 09.4 | B | Texto provisório bloqueia a publicação oficial | `content/content.test.ts` › «não há conteúdo provisório publicado» | G |
| — | Lacuna | **Descrição final** (CON-05): **sem cobertura**. O gate **falha hoje**: ver [CA-28](#ca-28) | | |

### CA-10

Detalhe de serviço com CTA que abre o formulário com o serviço pré-selecionado.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 10.1 | P | No navegador, do serviço ao formulário | `tests/e2e/jornada-visitante.spec.ts` › «fluxo positivo completo» | E |
| 10.2 | P | Endereço do CTA | `content/itens-do-mvp.test.ts` › «o CTA de contato leva ao formulário com o serviço pré-selecionado». `lib/domain/content/integrity.test.ts` › «pré-seleciona o serviço no formulário de contato» | U |
| 10.3 | N | Serviço forjado não vira categoria | `lib/domain/forms/routing.test.ts` › «serviço que não está na lista do site não vira categoria (TECH-06)». `lib/server/forms/submission-service.test.ts` › «valor forjado em formato de slug não vira categoria, nem no e-mail, e o pedido segue» | U |
| 10.4 | B | Serviço vazio, `nao-sei` ou que saiu da lista | `lib/domain/forms/schemas.test.ts` › «aceita serviço vazio, 'nao-sei' e slug que saiu da lista durante o preenchimento» | U |
| 10.5 | B | Falha ao ler a lista não perde o pedido | `lib/server/forms/submission-service.test.ts` › «falha ao consultar a lista não perde o pedido» | U |

### CA-11

Cases cujo material foi entregue, publicados com os campos de CASE-11. **Condicionado ao material.**

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 11.1 | P | Case completo publica e mostra tudo | `lib/domain/content/case-schema.test.ts` › «aceita case completo sem desafio/solução/resultados/data/equipe». `app/(site)/cases/[slug]/detalhe.test.ts` › «com tudo preenchido, mostra capa, galeria, links, equipe e relações» | U |
| 11.2 | P | Os três cases do MVP são encontrados | `tests/e2e/cases-do-mvp.spec.ts` › «aparece no filtro da categoria e leva ao detalhe» | E |
| 11.3 | N | Campos obrigatórios e regras | `lib/domain/content/case-schema.test.ts` › «lista campos obrigatórios ausentes»; «recusa data futura e link sem https» | U |
| 11.4 | N | Case não confunde a Benjamin com o NúcleoTech | `tests/e2e/cases-do-mvp.spec.ts` › «o case FECAP credita a Agência Benjamin; o NúcleoTech aparece só no crédito da plataforma». `content/itens-do-mvp.test.ts` › «não confunde a Agência Benjamin com o NúcleoTech, que só desenvolve a plataforma» | E, U |
| 11.5 | B | Sem material, nada aparece como trabalho real | `content/itens-do-mvp.test.ts` › «sem material autorizado, não apresenta nada como trabalho real do cliente». `tests/e2e/cases-do-mvp.spec.ts` › «não mostra selo de provisório nem campo vazio como resultado» | U, E |
| 11.6 | B | Só os campos obrigatórios | `app/(site)/cases/[slug]/detalhe.test.ts` › «só com os campos obrigatórios, nada opcional aparece vazio» | U |
| — | Lacuna | Material real dos três cases: **não entregue** (CON-06 a CON-08), então não há o que testar. Aceite por case: homologação | | |

### CA-12

Filtros por categoria, serviço, área e cliente funcionando.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 12.1 | P | Os quatro filtros na consulta | `lib/server/content/repository.test.ts` › «filtra cases por categoria, serviço, área e cliente» | U |
| 12.2 | P | Combinados, sobre a RLS real | `tests/integration/supabase/filtros-paginacao.test.ts` › «combina categoria com serviço, área e cliente» | S |
| 12.3 | P | Categoria pelo endereço, no navegador | `tests/e2e/portfolio.spec.ts` › «o filtro por categoria mostra só os cases dela» | E |
| 12.4 | N | Serviço em rascunho não filtra | `tests/integration/supabase/filtros-paginacao.test.ts` › «serviço em rascunho não filtra nada: o serviço e os vínculos com ele ficam fora (RLS)» | S |
| 12.5 | B | Filtro sem resultado | `tests/e2e/estados-globais.spec.ts` › «filtro sem resultado explica o que houve e oferece limpar, sem rolagem lateral» | E |
| 12.6 | B | Paginação | `tests/integration/supabase/filtros-paginacao.test.ts` › «páginas somadas reproduzem a lista, sem repetir; além da última vem vazia com os totais» | S |
| — | Lacuna | Filtros de serviço, área e cliente **no navegador: sem cobertura**. Só categoria, e pelo endereço (J1.4 é manual, na QA-02) | | |

### CA-13

Nenhum case sem material validado aparece como publicado.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 13.1 | N | Case incompleto não vai ao ar | `tests/integration/jornada-publicacao.test.ts` › «negativo: viewer não publica e case incompleto não vai ao ar». `lib/server/cms/cases.test.ts` › «publicar lista o que falta com os nomes dos campos do painel (CASE-11)» | U |
| 13.2 | N | Rascunho, arquivado e agendado ficam ocultos | `tests/integration/supabase/visibilidade-publica.test.ts` › «consultas do site não trazem nenhum dos itens ocultos»; «leitura direta de cases com a chave anônima não expõe os ocultos» | S |
| 13.3 | B | Item provisório bloqueia a publicação oficial | `content/content.test.ts` › «não há conteúdo provisório publicado» | G |
| — | Lacuna | Se o material foi **validado e autorizado: sem cobertura**, é julgamento humano. Hoje os três cases estão publicados como provisórios no conteúdo versionado, e o gate falha por isso | | |

## 5. Formulários

### CA-14

Formulários de novo projeto, contato e feedback validam campos e confirmam com protocolo.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 14.1 | P | Envio persiste, notifica e devolve protocolo | `lib/server/forms/submission-service.test.ts` › «S1 sucesso: persiste, notifica e devolve protocolo». `lib/domain/forms/routing.test.ts` › «gera protocolo curto a partir do identificador» | U |
| 14.2 | P | Pedido de projeto no navegador | `tests/e2e/jornada-visitante.spec.ts` › «fluxo positivo completo» | E |
| 14.3 | P | Três tipos no banco real | `tests/integration/supabase/formularios.test.ts` › «grava cada tipo com sua categoria e notifica o destinatário certo» | S |
| 14.4 | N | Obrigatórios e formatos | `lib/domain/forms/schemas.test.ts` › «exige campos obrigatórios com mensagens em português»; «rejeita telefone sem DDD e e-mail inválido»; «valida o assunto a partir da lista fechada»; «exige e-mail quando a pessoa pede retorno»; «valida nota de 1 a 5» | U |
| 14.5 | N | Erros por campo, sem gravar | `lib/server/forms/submission-service.test.ts` › «S2 validação: devolve erros por campo e repreenche valores, sem persistir» | U |
| 14.6 | N | Erros na tela | `tests/e2e/jornada-visitante.spec.ts` › «negativo: campos inválidos mostram erros e focam o primeiro campo» | E |
| 14.7 | B | Normalização e quebra de linha | `lib/domain/forms/schemas.test.ts` › «normaliza nome, e-mail e telefone»; «nome e empresa ficam em uma linha: quebra de linha não forja linhas no e-mail (TECH-06)» | U |
| 14.8 | B | Feedback anônimo | `lib/domain/forms/schemas.test.ts` › «aceita feedback anônimo» | U |
| 14.9 | P | Contato e feedback no navegador | `tests/e2e/formularios.spec.ts` › «válido mostra confirmação e protocolo»; «anônimo válido mostra confirmação e protocolo» | E |
| 14.10 | N | Erro no campo, com foco, sem ir ao servidor | `tests/e2e/formularios.spec.ts` › «inválido mostra o erro no campo, com foco nele, sem ir ao servidor»; «'quero retorno' sem e-mail dá erro no campo de e-mail, sem ir ao servidor»; «sem perfil, o erro aparece e o foco vai para a primeira opção» | E |
| 14.11 | N | Navegador valida com o esquema do servidor | `lib/domain/forms/browser-validation.test.ts` › «campo inválido devolve o mesmo erro do servidor, com o texto digitado»; «erro só em campo técnico não trava o visitante: quem decide é o servidor»; «honeypot preenchido segue para o servidor mesmo com outros erros: o robô não recebe pista» | U |
| 14.12 | P | Sem JavaScript, nos três formulários | `tests/e2e/formularios.spec.ts` › «feedback válido mostra confirmação e protocolo»; «/contato leva ao formulário de novo projeto, que envia e confirma»; «/contato leva ao formulário de contato, que valida no servidor e confirma» | E |
| 14.13 | N | Sem JavaScript, o servidor recusa e devolve o texto | `tests/e2e/formularios.spec.ts` › «feedback inválido destaca o campo e devolve o que foi digitado». `app/(site)/actions.test.ts` › «devolve o erro com o texto digitado, para o envio sem JavaScript repreencher o formulário» | E, U |
| 14.14 | B | Envio antes da hidratação | `tests/e2e/formularios.spec.ts` › «/contato: o resultado aparece e a página hidrata sem erro»; «/feedback: erro de validação aparece com foco no campo e sem perder o texto» | E |
| 14.15 | B | Campos técnicos vazios | `lib/domain/forms/schemas.test.ts` › «campos técnicos vazios (sem JavaScript) valem como ausentes (FORM-08)»; «campo técnico preenchido com valor forjado continua recusado (FORM-08)». `lib/server/forms/submission-service.test.ts` › «é aceito e gravado, sem origem» | U |

### CA-15

Envio chega ao destinatário institucional definido pela Benjamin.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 15.1 | P | Cada tipo vai à própria lista | `lib/domain/forms/routing.test.ts` › «usa a lista própria de cada tipo e cai para a de leads quando vazia». `tests/integration/jornada-lead.test.ts` › «contato vai ao destinatário próprio, com retorno para quem escreveu, e exige lead:view» | U |
| 15.2 | N | Configuração inválida barra | `lib/config/env.test.ts` › «exige segredo, Resend e destinatário em produção»; «recusa destinatário inválido em qualquer lista e aponta a variável (TECH-06)» | U |
| 15.3 | N | Feedback sem pedido de retorno não expõe resposta | `lib/domain/forms/routing.test.ts` › «não expõe reply-to em feedback sem pedido de retorno» | U |
| 15.4 | B | Sem destinatário configurado | `lib/server/forms/submission-service.test.ts` › «S10 sem destinatário configurado: registro salvo com notificação 'skipped'» | U |
| 15.5 | P | Chamada à API da Resend, com `fetch` falso | `lib/server/forms/notifier.test.ts` › «faz POST na API da Resend, com autorização e chave de idempotência»; «manda remetente, destinatários, assunto, texto e reply_to» | U |
| 15.6 | N | Recusa do provedor vira exceção | `lib/server/forms/notifier.test.ts` › «resposta %i vira exceção com o status»; «falha de rede sobe para quem chamou, que a registra para o reenvio» | U |
| — | Lacuna | **Envio real pelo Resend ao destinatário real: sem cobertura.** Todos os testes usam um notificador ou um `fetch` falso. Depende de CON-10 e GO-02 (J3.3, FORM-10, GO-05; registro em [FORM-10](form-10-entrega-de-contatos.md)) | | |

### CA-16

Envio duplicado não gera dois registros; falha de e-mail não perde o lead.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 16.1 | N | S3: mesmo identificador | `lib/server/forms/submission-service.test.ts` › «S3 duplo clique: mesmo submissionId não duplica nem renotifica» | U |
| 16.2 | N | S4: mesmo conteúdo em 10 min | `lib/server/forms/submission-service.test.ts` › «S4 reenvio após recarregar: mesmo conteúdo com outro id em 10 min é duplicado» | U |
| 16.3 | N | S7: falha do banco | `lib/server/forms/submission-service.test.ts` › «S7 falha no banco: erro SERVICE_UNAVAILABLE e nada notificado» | U |
| 16.4 | N | S8: falha do e-mail preserva o lead | `lib/server/forms/submission-service.test.ts` › «S8 falha na notificação: lead preservado, usuário vê sucesso e reenvio posterior entrega» | U |
| 16.5 | B | S5: mesmo conteúdo depois da janela | `lib/server/forms/submission-service.test.ts` › «S5 mesmo conteúdo após a janela vira novo registro» | U |
| 16.6 | B | S11: envios simultâneos | `tests/integration/supabase/formularios.test.ts` › «corrida do mesmo submissionId vira DuplicateSubmissionError, não um segundo registro». `supabase/tests/database/form_submissions_rls.test.sql` › «mesmo submissionId não vira dois registros (S11)» | S, D |
| 16.7 | B | S13: tentativas esgotadas não travam a fila | `lib/server/forms/submission-service.test.ts` › «S13 tentativas esgotadas não travam a fila: envios novos continuam sendo reenviados». `tests/integration/supabase/formularios.test.ts` › «fila de reenvio traz quem falhou e ainda tem tentativas, e deixa os esgotados de fora» | U, S |
| 16.8 | B | Tipos diferentes não se confundem | `tests/integration/jornada-lead.test.ts` › «mesma pessoa e mesma mensagem em tipos diferentes geram registros distintos» | U |
| 16.9 | N | Duplo clique no navegador | `tests/e2e/formularios.spec.ts` › «duplo clique gera um único POST e um único protocolo» | E |
| 16.10 | N | S15: rede cai, resposta se perde, erro da plataforma | `tests/e2e/formularios.spec.ts` › «conexão caiu: mostra o aviso, mantém o que foi digitado e o reenvio funciona»; «resposta perdida depois de salvar: o reenvio não duplica e devolve o mesmo protocolo»; «resposta que não é da aplicação (erro 500 da plataforma): mesmo aviso, formulário de pé» | E |
| 16.11 | N | S16: falha ao gravar o resultado da notificação | `lib/server/forms/submission-service.test.ts` › «e-mail enviado: o visitante vê sucesso, e o envio não é marcado como falha»; «e-mail recusado: o visitante vê sucesso e os dois problemas ficam no log»; «sem destinatário: o visitante vê sucesso»; «o reenvio agendado não para no primeiro registro com problema» | U |
| 16.12 | N | S12: ambiente real sem armazenamento persistente | `lib/server/forms/deps.test.ts` › «Production da Vercel com ambiente do site em %s: recusa, em vez de guardar em memória»; «ambiente do site em %s: recusa em qualquer hospedagem». `lib/domain/forms/store-policy.test.ts` › «site em %s e Vercel em %s: não pode, é um deploy real com o ambiente mal configurado» | U |
| 16.13 | B | S12: desenvolvimento e preview continuam em memória | `lib/server/forms/deps.test.ts` › «preview da Vercel continua em memória»; «desenvolvimento, build e E2E locais, sem VERCEL_ENV, continuam em memória» | U |
| 16.15 | P | Rota do job: pendente entregue uma vez, sem repetir | `tests/e2e/job-de-notificacoes.spec.ts` › «pendente é entregue uma vez, sem mudar o envio, e a segunda rodada não repete» | C |
| 16.16 | B | Rota do job: intervalo e tentativas esgotadas | `tests/e2e/job-de-notificacoes.spec.ts` › «falha antiga é reenviada; falha recente espera o intervalo; a esgotada fica de fora» | C |
| 16.14 | B | S14: antispam sem o tempo de preenchimento | `lib/server/forms/submission-service.test.ts` › «o tempo mínimo não se aplica, como a quem omite o campo: não é uma brecha nova»; «honeypot preenchido continua recusado em silêncio»; «o limite por origem continua valendo»; «o mesmo conteúdo com outro identificador volta como duplicado» | U |
| — | Lacuna | A rota `/api/internal/jobs/notificacoes` em si: **sem cobertura** | | |

### CA-17

Aviso de privacidade validado e linkado em todos os formulários.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 17.1 | P | Página abre | `tests/e2e/motion.spec.ts` › «/privacidade: tudo visível, imagens carregadas, sem overflow nem erro» | E |
| 17.2 | P | Formulário de novo projeto pede ciência do aviso | `tests/e2e/jornada-visitante.spec.ts` › «fluxo positivo completo» | E |
| 17.3 | N | Sem a ciência, o envio é recusado | `lib/domain/forms/schemas.test.ts` › «exige campos obrigatórios com mensagens em português» | U |
| 17.4 | P | Link nos três formulários, e sem a ciência nada é enviado | `tests/e2e/formularios.spec.ts` › «novo projeto: o aviso está linkado, e sem a ciência nada é enviado»; «contato: o aviso está linkado, e sem a ciência nada é enviado»; «feedback: o aviso está linkado, e sem a ciência nada é enviado» | E |
| 17.5 | N | Recusa sem ciência em contato e feedback | `lib/domain/forms/schemas.test.ts` › «recusa envio sem a ciência do aviso de privacidade (SEG-03)»; «recusa envio sem a ciência do aviso de privacidade, mesmo anônimo (SEG-03)». `lib/server/forms/submission-service.test.ts` › «%s: sem a ciência nada é salvo nem notificado» | U |
| 17.6 | P | O registro guarda a ciência | `lib/server/forms/submission-service.test.ts` › «%s: o registro guarda a ciência declarada» | U |
| 17.7 | P | Aviso alcançável pelo rodapé e pelo formulário | `tests/e2e/formularios.spec.ts` › «o rodapé leva a /privacidade, que responde 200»; «o link do formulário abre o aviso em nova aba, sem perder o que foi digitado»; «sem JavaScript, os formulários em página própria também linkam o aviso» | E |
| — | Lacuna | **Texto validado** (SEG-02, SEG-10): **sem cobertura**, a página ainda é minuta | | |

## 6. Painel administrativo (CMS)

### CA-18

Login, sessão, renovação e logout funcionando; sem cadastro público.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 18.1 | P | Login real leva ao painel | `tests/e2e/jornada-editor-cms.spec.ts` › «J2.5 rascunho → publicar → editar → arquivar, refletindo no site sem redeploy» | C |
| 18.2 | P | Só login, recuperação e callback são públicos | `lib/domain/auth/redirect.test.ts` › «libera somente login, recuperação e callback» | U |
| 18.3 | N | Sem sessão vai ao login, preservando o destino | `tests/e2e/jornada-visitante.spec.ts` › «negativo: painel sem sessão redireciona ao login preservando o destino». `lib/server/auth/guards.test.ts` › «N01 — sem sessão redireciona ao login com retorno» | E, U |
| 18.4 | N | Redirecionamento inseguro depois do login | `lib/domain/auth/redirect.test.ts` › «bloqueia destino inseguro https://evil.com/admin»; «bloqueia destino inseguro //evil.com»; «bloqueia destino inseguro /admin/../servicos» | U |
| 18.5 | B | Conta pendente e senha fraca | `lib/server/auth/guards.test.ts` › «N03 — conta pendente vai para o aviso de acesso pendente». `lib/domain/auth/redirect.test.ts` › «exige 12+ caracteres com letras e números» | U |
| — | Lacuna | **Logout, renovação de sessão, senha errada e cadastro público desligado: sem cobertura.** Há o roteiro manual de [ADM-02 §4](../seguranca/autenticacao.md). O cadastro é configuração do Supabase de produção (GO-01 §3); `supabase/config.toml` local deixa `enable_signup = true` | | |

### CA-19

Permissões por papel aplicadas no servidor e no banco (casos N01 a N13 de [TECH-03](../seguranca/matriz-rbac.md)).

| Caso | Classe | Cenário | Testes | Bateria | Situação |
| ---- | ------ | -------- | ------ | ------- | -------- |
| N01 | N | Anônimo abre `/admin` | `lib/server/auth/guards.test.ts` › «N01 — sem sessão redireciona ao login com retorno». `tests/e2e/jornada-paginas-cms.spec.ts` › «visitante não abre o editor nem lê rascunho» | U, C | Coberto |
| N02 | N | Anônimo chama ação do painel | `lib/server/auth/guards.test.ts` › «N02 — sem sessão lança UNAUTHENTICATED (401)»; «não executa a ação sem permissão e devolve envelope de erro». `tests/e2e/acesso-indevido-painel.spec.ts` › «sem sessão, nada grava: nem na tela da ação, nem por uma rota pública» | U, C | Coberto |
| N03 | N | Conta `pending` | `lib/server/auth/guards.test.ts` › «N03 — conta pendente vai para o aviso de acesso pendente». `lib/domain/auth/rbac.test.ts` › «pending não tem nenhuma permissão» | U | Coberto |
| N04 | N | `editor` exclui | `lib/server/auth/guards.test.ts` › «N04 — editor excluindo case lança FORBIDDEN (403)». `lib/domain/auth/rbac.test.ts` › «editor não pode service:delete»; «editor não pode case:delete»; «editor não pode media:delete». `tests/integration/supabase/cms-areas.test.ts` › «editor arquiva, mas só admin exclui definitivamente — e só arquivado» | U, S | Coberto |
| N05 | N | `editor` abre leads | `lib/server/auth/guards.test.ts` › «N05 — editor abrindo leads vai para 'sem permissão'». `supabase/tests/database/form_submissions_rls.test.sql` › «editor não consulta (N05)» | U, D | Coberto |
| N06 | N | `editor` altera contato ou redes | `lib/domain/auth/rbac.test.ts` › «editor não pode settings:edit». `tests/integration/supabase/configuracao-institucional.test.ts` › «editor não altera pela API REST direta». `tests/e2e/jornada-configuracoes-cms.spec.ts` › «editor vê em modo leitura e o servidor recusa o envio forçado» | U, S, C | Coberto |
| N07 | N | `viewer` edita ou publica | `lib/domain/content/publication.test.ts` › «viewer não salva nem publica». `tests/integration/supabase/cms-areas.test.ts` › «leitor não consegue gravar nem pelo banco (RLS)». `tests/e2e/jornada-editor-cms.spec.ts` › «J2.6 leitor vê o CMS só para leitura e não cria conteúdo» | U, S, C | Coberto |
| N08 | N | `super_admin` abre leads | `lib/server/auth/guards.test.ts` › «N08 — super_admin não lê leads». `supabase/tests/database/form_submissions_rls.test.sql` › «super_admin não consulta (minimização, N08)» | U, D | Coberto |
| N09 | N | `admin` promove alguém a `admin` | `lib/domain/auth/rbac.test.ts` › «admin só gerencia editor, viewer e pending». `supabase/tests/database/storage_media.test.sql` › «anon: sem EXECUTE em assign_role». `tests/e2e/acesso-indevido-dados.spec.ts` › «N09: admin não promove ninguém a admin; editor e leitor não mudam papel de ninguém» | U, D, C | Coberto, com `assign_role` real pela API REST |
| N10 | N | Altera o próprio papel | `lib/domain/auth/rbac.test.ts` › «ninguém altera o próprio papel». `tests/e2e/acesso-indevido-dados.spec.ts` › «N10: ninguém muda o próprio papel, nem pela tabela nem pela função» | U, C | Coberto, pela tabela e pela função |
| N11 | N | Papel forjado no cliente | `lib/domain/auth/rbac.test.ts` › «papel ausente, nulo ou forjado é negado». `tests/e2e/acesso-indevido-painel.spec.ts` › «N11: papel forjado em cookie, formulário ou cabeçalho é ignorado»; «N11: token alterado no cookie cai no login, sem gravar» | U, C | Coberto |
| N12 | N | `select` anônimo em leads | `supabase/tests/database/form_submissions_rls.test.sql` › «visitante não lê a tabela (N12)». `tests/integration/supabase/formularios.test.ts` › «visitante com a chave anônima não lê nem grava (42501)» | D, S | Coberto. O documento diz "0 linhas", e o teste confirma erro 42501: alinhar |
| N13 | N | Sessão expirada em escrita | `lib/server/auth/guards.test.ts` › «N02 — sem sessão lança UNAUTHENTICATED (401)». `tests/e2e/acesso-indevido-painel.spec.ts` › «N13: sessão encerrada no servidor cai no login ao tentar gravar, sem gravar» | U, C | Coberto: sessão encerrada no servidor, com o cookie ainda no navegador |
| — | P | Papéis permitidos entram e publicam | `lib/domain/auth/rbac.test.ts` › «todos os papéis ativos entram no painel»; «editor cria, edita, publica e arquiva conteúdo» | U | — |
| — | B | Código e banco iguais | `lib/server/auth/rbac-sql.test.ts` › «o seed SQL de role_permissions é idêntico à matriz em código» | U | — |

### CA-20

Equipe da Benjamin edita textos institucionais, serviços, cases, mídia, contato e redes sem ajuda do NúcleoTech.

**Sem cobertura**: é um critério institucional, verificado na [homologação](homologacao.md) (Parte 2). Os testes abaixo
só mostram que as telas funcionam, e não que a equipe consegue usá-las sozinha.

| Tema | Testes de apoio | Bateria | Observação |
| ---- | ----------------- | ------- | ----------- |
| Páginas e textos | `tests/e2e/jornada-paginas-cms.spec.ts` › «editor cria rascunho, escreve blocos e publica; o que salvou reaparece» | C | |
| Cases | `tests/e2e/jornada-editor-cms.spec.ts` › «J2.5 rascunho → publicar → editar → arquivar, refletindo no site sem redeploy» | C | |
| Serviços | `tests/integration/supabase/cms-servicos.test.ts` › «editor cria o serviço com áreas e imagem; vínculo gravado pela RLS do editor» | S | Sem E2E |
| Mídia | `tests/e2e/jornada-midia-cms.spec.ts` › «imagem de 5 MB entra na biblioteca» | C | |
| Contato e redes | `tests/e2e/jornada-configuracoes-cms.spec.ts` › «admin altera rede e contato; rodapé e /contato mudam sem deploy, e a restauração volta tudo» | C | Salvar vai direto ao ar, sem rascunho |
| CTAs e destaques | `tests/e2e/jornada-home-cms.spec.ts` › «publicado vira botão na Home, navegável, e entra na API pública»; «destaque é marcado no serviço, a tela de CTAs mostra onde, e a Home acompanha». `tests/integration/supabase/cms-ctas.test.ts` › «editor salva; quem não é do painel não lê, nem direto pela API REST» | C, S | Só local: o site publicado ainda não está ligado ao Supabase (GO-02) |

### CA-21

Rascunho nunca aparece no site; publicação reflete no site em até 5 s.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 21.1 | P | Publicar reflete em até 5 s, medido no navegador | `tests/e2e/jornada-editor-cms.spec.ts` › «J2.5 rascunho → publicar → editar → arquivar, refletindo no site sem redeploy». `tests/e2e/home-cases-em-destaque.spec.ts` › «publicado no painel, aparece na Home com acesso ao detalhe» | C |
| 21.2 | P | Transição e cache na regra | `tests/integration/jornada-publicacao.test.ts` › «rascunho → publicado → visível, íntegro e com cache invalidado». `lib/server/content/invalidate.test.ts` › «cabe na meta de refletir no site em até 5 s» | U |
| 21.3 | N | Rascunho e arquivado ocultos em consultas e leitura direta | `tests/integration/supabase/visibilidade-publica.test.ts` › «consultas do site não trazem nenhum dos itens ocultos»; «leitura direta de pages com a chave anônima não expõe os ocultos». `supabase/tests/database/cms_content.test.sql` › «anon: só áreas publicadas (sem rascunho nem data futura)» | S, D |
| 21.4 | N | Arquivar tira do site | `tests/e2e/home-cases-em-destaque.spec.ts` › «arquivado, sai da Home». `tests/integration/jornada-publicacao.test.ts` › «arquivar case: some do site e CTAs usam fallback» | C, U |
| 21.5 | B | Publicação agendada | `lib/server/content/repository.supabase.test.ts` › «publicação agendada para o futuro não aparece nem no detalhe». `lib/domain/content/slug.test.ts` › «só exibe publicados com data já alcançada» | U |
| 21.6 | B | Regeneração em andamento não traz versão velha | `lib/server/content/invalidate.test.ts` › «depois do prazo, expira de novo as mesmas tags, para descartar regeneração em andamento» | U |

### CA-22

Upload de imagem com validação e uso em case/serviço.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 22.1 | P | Envio direto ao Storage, no navegador | `tests/e2e/jornada-midia-cms.spec.ts` › «imagem de 5 MB entra na biblioteca»; «PDF de 8 MB entra na biblioteca, sem o arquivo passar pela Server Action» | C |
| 22.2 | P | Uso em case e serviço | `lib/server/cms/cases.test.ts` › «grava capa, serviços, links, mês e galeria na ordem escolhida». `lib/server/cms/services.test.ts` › «cria rascunho com áreas, exemplos, imagem e destaque». `tests/integration/supabase/cms-cases.test.ts` › «editor envia a capa: arquivo no bucket público e registro na biblioteca» | U, S |
| 22.3 | N | Formato e conteúdo recusados | `lib/domain/media/policy.test.ts` › «recusa SVG e formatos não listados»; «detecta arquivo disfarçado (extensão/tipo não batem com o conteúdo)». `tests/e2e/jornada-midia-cms.spec.ts` › «assinatura falsa é recusada e não sobra no bucket» | U, C |
| 22.4 | N | Limite antes de enviar | `tests/e2e/jornada-midia-cms.spec.ts` › «arquivo acima do limite é recusado no navegador, antes de qualquer envio». `tests/integration/supabase/cms-midia-direta.test.ts` › «o bucket recusa arquivo acima de 10 MB, mesmo com autorização» | C, S |
| 22.5 | N | Sem permissão | `lib/server/cms/media-service.test.ts` › «leitor não recebe autorização». `tests/integration/supabase/cms-cases.test.ts` › «leitor não envia arquivo ao bucket (política do Storage)» | U, S |
| 22.6 | B | Tamanho declarado não vale; registro que falha limpa o arquivo | `lib/server/cms/media-service.test.ts` › «o tamanho declarado no passo 1 não vale: o que manda é o que chegou»; «se o registro falhar, o arquivo enviado é apagado do Storage» | U |
| 22.7 | B | Token inválido e arquivo vazio | `tests/integration/supabase/cms-midia-direta.test.ts` › «o token vale uma vez e só para aquele caminho». `lib/domain/media/policy.test.ts` › «limita dimensões de imagem e rejeita arquivo vazio» | S, U |

Ficam fora do critério: excluir arquivo e editar o texto alternativo, que dependem do gerenciador (ADM-09).

Observação: apesar do nome, o teste do token só envia um token inválido. Reusar um token válido: **sem cobertura**.

### CA-23

Leads e feedbacks visíveis apenas para `admin`; acessos auditados.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 23.1 | P | `admin` consulta e muda só o status | `tests/integration/supabase/formularios.test.ts` › «admin consulta os três tipos e altera só o status». `supabase/tests/database/form_submissions_rls.test.sql` › «admin consulta lead, contato e feedback» | S, D |
| 23.2 | N | Outros papéis não consultam | `tests/integration/supabase/formularios.test.ts` › «super_admin, editor, viewer e pendente não consultam nem alteram». `supabase/tests/database/form_submissions_rls.test.sql` › «viewer não consulta»; «conta pendente não consulta» | S, D |
| 23.3 | N | `admin` não altera o que foi enviado | `supabase/tests/database/form_submissions_rls.test.sql` › «admin não altera o conteúdo enviado»; «nem o admin cria envio pelo painel» | D |
| 23.4 | N | Eventos de auditoria por papel | `supabase/tests/database/audit_event_roles.test.sql` › «viewer não pode registrar acesso a lead»; «super_admin não ganha acesso a eventos com dados pessoais» | D |
| 23.5 | B | Permissão separada por tipo | `supabase/tests/database/form_submissions_rls.test.sql` › «só com feedback:view: enxerga feedback, nem lead nem contato» | D |
| — | Lacuna | **Tela de consulta (FORM-09): não existe na `main`.** O evento `lead.viewed` ao abrir um lead: **sem cobertura** em fluxo real (J3.4) | | |

### CMS: regras complementares

Não têm critério próprio, mas sustentam CA-20 a CA-22. A descrição dos 16 casos está na [QA-04](qa-04-cms.md).

| Tema | Classe | Testes | Bateria |
| ---- | ------ | ------ | ------- |
| 240 combinações de entidade, transição e papel | P, N | `lib/server/cms/publication-matrix.test.ts` (nomes do tipo «área: draft → publish como editor») | U |
| Edição concorrente | N | `lib/server/cms/content-service.test.ts` › «edição concorrente: versão desatualizada vira CONFLICT». `tests/integration/supabase/cms-areas.test.ts` › «versão desatualizada é recusada (concorrência otimista)» | U, S |
| Bloqueio por dependência | N | `lib/domain/content/integrity.test.ts` › «bloqueia arquivar a única área de um serviço publicado»; «bloqueia arquivar o único serviço de um case publicado»; «bloqueia arquivar categoria usada por case publicado» | U |
| Gravação atômica | N | `supabase/tests/database/cms_gravacao_atomica.test.sql` › «falha na galeria (última etapa) desfaz o texto do case». `tests/integration/supabase/cms-gravacao-atomica.test.ts` › «case: imagem inexistente, a última etapa, desfaz o texto e os serviços» | D, S |
| Slug e redirecionamento | B | `lib/server/cms/slugs.test.ts` › «excluir serviço já publicado deixa o endereço reservado». `supabase/tests/database/slugs_e_urls.test.sql` › «endereço reservado responde 404» | U, D |
| Páginas e blocos | P, N | `lib/server/cms/pages.test.ts` › «não deixa publicada sem bloco: a última exclusão é recusada». `tests/e2e/jornada-paginas-cms.spec.ts` › «erro de validação aparece no campo e preserva o que foi digitado»; «leitor vê os blocos, mas não edita» | U, C |

Teste instável conhecido: `tests/integration/supabase/slugs-e-urls.test.ts` › «excluído, os endereços ficam reservados e respondem 404» ([handoff §5](../operacao/handoff-e-manutencao.md)).

## 7. Produção e publicação

### CA-24

Produção isolada da homologação (projetos e chaves separados).

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 24.1 | N | Homologação e produção não usam o conteúdo provisório | `lib/server/content/sources.test.ts` › «homologação e produção nunca usam o conteúdo provisório (INT-02)» | U |
| 24.2 | N | Seed e contas de teste não alcançam produção | `scripts/content-seed.test.mjs` › «recusa banco marcado como produção antes de qualquer insert». `scripts/seed-users.test.mjs` › «só aceita o Supabase local» | U |
| 24.3 | N | Convite exige confirmar o ambiente | `scripts/provision-admin.test.mjs` › «exige confirmação explícita do ambiente (evita convidar no ambiente errado)» | U |
| 24.4 | B | Marcação do banco de produção | `supabase/tests/database/ambiente_banco.test.sql` › «a migration não marca nenhum banco»; «só aceita o valor producao» | D |
| — | Lacuna | **Projetos e chaves de fato separados: sem cobertura**, verificação manual (GO-02 §5). Em 02/11 só havia um projeto ([provisionamento §6](../operacao/provisionamento-producao.md)) | | |

### CA-25

Domínio oficial com HTTPS válido. **Condicionado ao domínio (CON-11).**

**Sem cobertura.** Verificação manual por `curl -I` e SSL Labs ([GO-03 §4](../operacao/dominio-dns-https.md)). O cabeçalho HSTS está no `next.config.ts`, sem teste: ver a seção 10.

### CA-26

Backup do banco e da mídia configurado e restauração testada.

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 26.1 | P | Restauração completa em stack nova, com dados fictícios | `npm run test:restore` (`scripts/test-restore.mjs`): roteiro com verificações próprias, sem nomes do Vitest | Própria, com Supabase local |
| 26.2 | N | Caminhos e argumentos inseguros | `scripts/backup-media.test.mjs` › «recusa comando desconhecido, pasta ausente e variáveis ausentes»; «enviar exige digitar o host do destino»; «recusa a raiz e qualquer pasta dentro do repositório» | U |
| 26.3 | B | Caminho de objeto no bucket | `scripts/backup-media.test.mjs` › «recusa "../fora.webp"»; «recusa "2026/../../fora.webp"» | U |
| — | Lacuna | **Primeira cópia real de produção: sem cobertura e não feita** ([go/no-go E10](../operacao/go-no-go.md)). A rotina semanal é manual | | |

### CA-27

Checklist de release e plano de rollback executáveis.

**Sem cobertura.** É um documento aprovado por revisão ([GO-01](../operacao/release-e-rollback.md)). O rollback não foi exercitado, e o plano descreve `main → production`, fluxo que em 02/11 não era o usado pela Vercel.

### CA-28

`npm run verify` verde no commit publicado e sem conteúdo provisório (`check:release-content`).

| # | Classe | Cenário | Testes | Bateria |
| - | ------ | -------- | ------ | ------- |
| 28.1 | P | `verify` | Cabeçalhos, formatação, tipos, lint, testes U e build. Resultado na seção 11 | U + build |
| 28.2 | N | Gate de conteúdo | `content/content.test.ts` › «não há conteúdo provisório publicado» | G |
| 28.3 | B | Seed em dia com `content/` | `scripts/content-seed.test.mjs` › «está em dia com content/ (senão: npm run seed:write)» | U |
| — | Situação | **O gate falha hoje, como esperado:** 20 itens provisórios (6 áreas, 9 serviços, 3 cases, manifesto e Sobre), até a aprovação da agência | | |

### CA-29

Smoke test pós-publicação sem falhas (páginas, formulários, painel, API `/api/v1/health`).

**Sem cobertura** como bateria. É o roteiro manual de [GO-01 §5](../operacao/release-e-rollback.md) e da QA-11, ainda sem ambiente. A bateria **E** pode rodar contra um ambiente com `E2E_BASE_URL`, mas isso nunca foi feito. Nenhum teste chama `/api/v1/health`.

## 8. Segurança além dos critérios

| Tema | Classe | Testes | Bateria |
| ---- | ------ | ------ | ------- |
| Conteúdo do banco não vira HTML | N | `components/sections/page-blocks.test.ts` › «escapa o conteúdo: nada vindo do banco vira HTML» | U |
| Query string não injeta mensagem | N | `components/admin/cms/flash-message.test.ts` › «ignora mensagens de aviso arbitrárias vindas da query string» | U |
| SVG oficial sem script | N | `components/ui/brand-icon.test.ts` › «os SVGs são só vetor: sem imagem embutida, script, texto ou referência externa» | U |
| CTA só para rota conhecida ou https | N | `lib/domain/content/blocks.test.ts` › «CTA só aponta para rota pública conhecida ou link https». `supabase/tests/database/cms_content.test.sql` › «CTA com caminho //host» | U, D |
| Entrada malformada na API | N | `tests/e2e/seo-e-compartilhamento.spec.ts` › «entrada malformada não expõe dados». `lib/server/http.test.ts` › «lança BAD_REQUEST com campos inválidos» | E, U |
| Erro sem detalhes internos | N | `lib/server/errors.test.ts` › «esconde detalhes de erros inesperados e registra no log». `lib/server/http.test.ts` › «esconde erro inesperado como INTERNAL_ERROR 500». `lib/server/content/supabase/queries.test.ts` › «falha do banco vira SERVICE_UNAVAILABLE com mensagem segura» | U |
| Rotas internas exigem segredo | N | `tests/e2e/acesso-indevido-dados.spec.ts` › «/api/internal/revalidate: 401 sem token e com token errado, sem expor nada»; «/api/internal/jobs/notificacoes: 401 sem token e com token errado, sem expor nada»; «o token de uma rota não abre a outra». `tests/e2e/seo-e-compartilhamento.spec.ts` › «rotas internas recusam quem não tem credencial, sem expor detalhes». `lib/server/internal-auth.test.ts` › «aceita somente o Bearer exato»; «nega quando o segredo não está configurado» | E, U |
| API pública não vaza campos internos | N | `lib/domain/api/contracts.test.ts` › «não expõem id interno, status nem campos de controle»; «o id interno da biblioteca de mídia nunca sai na API pública» | U |
| Logs sem dado pessoal | N | `lib/server/forms/submission-service.test.ts` › «envio válido: forms.submission.persisted e forms.notification.sent»; «falha na notificação: forms.notification.failed, mesmo com o e-mail na mensagem do erro»; «honeypot: forms.submission.spam_suspected com o motivo». `lib/server/forms/notifier.test.ts` › «registra só metadados, nunca o conteúdo nem os endereços». `lib/server/logger.test.ts` › «mascara chaves sensíveis em qualquer profundidade»; «mascara e-mail, telefone e tokens dentro de textos livres». `lib/server/audit.test.ts` › «envia evento com metadados filtrados (sem PII)» | U |
| Anti-abuso nos formulários | N | `lib/server/forms/submission-service.test.ts` › «S6 honeypot e envio rápido demais: sucesso silencioso sem persistir»; «S9 limite por origem: sexto envio em 10 min é bloqueado». `lib/domain/forms/schemas.test.ts` › «recusa envio com honeypot preenchido ou sem submissionId» | U |
| RLS em todas as tabelas | N | `lib/server/content/content-sql.test.ts` › «toda tabela de public habilita RLS (supabase/README.md)» | U |
| Visitante não grava | N | `tests/integration/supabase/conteudo-publico.test.ts` › «visitante não consegue gravar conteúdo (RLS)». `tests/integration/supabase/cms-paginas.test.ts` › «visitante não grava em páginas nem blocos» | S |
| Auditoria inviolável e obrigatória | N | `supabase/tests/database/audit_log.test.sql` › «DELETE de evento é recusado». `lib/server/audit.test.ts` › «falha em evento crítico aborta a operação». `lib/server/cms/content-service.test.ts` › «evento crítico sem auditoria aborta a operação (TECH-10)» | D, U |
| Negação registrada | N | `lib/server/auth/guards.test.ts` › «registra a negação na trilha de auditoria (TECH-10)». `tests/e2e/acesso-indevido-painel.spec.ts` › «a recusa fica na trilha de auditoria, sem o conteúdo do pedido» | U, C |
| Segredos e variáveis | N | `lib/config/env.test.ts` › «rejeita segredo curto»; «exige o segredo do reenvio de notificações só em produção (TECH-06)» | U |
| Retenção de dados | P, B | `lib/domain/forms/retention.test.ts` › «mantém lead dentro de 12 meses e exclui depois»; «anonimiza feedback identificado e exclui anônimo após 24 meses»; «respeita retenção suspensa (legal hold)» | U |
| Seed sem dados pessoais | N | `scripts/content-seed.test.mjs` › «não cria contas, senhas nem dados pessoais» | U |
| Cabeçalhos HTTP, HSTS e CSP | N | `tests/e2e/seguranca-cabecalhos.spec.ts` › «/ responde 200 com todos os cabeçalhos»; «a política está valendo: o que vem de fora é barrado, e os testes acima enxergariam» | E |
| Atributos do cookie de sessão | N | `tests/e2e/seguranca-cabecalhos.spec.ts` › «login: sessão fora do alcance do JavaScript e painel sem violação» | C |
| Tentativas de login e mensagem genérica | — | **Sem cobertura.** Roteiro manual de ADM-02 §4 | — |
| Rotas do painel sem sessão, deduzidas do disco | N | `tests/e2e/acesso-indevido-painel.spec.ts` › «/admin/leads/[id] leva ao login, com qualquer id» e uma por rota; «cabeçalhos forjados não pulam a barreira (CVE-2025-29927 e parecidos)»; «escrita alternativa não abre o painel: /%61dmin/leads» | C |
| Server Actions por POST real, com controle | N | `tests/e2e/acesso-indevido-painel.spec.ts` › «viewer: nenhuma ação proibida grava, e a resposta é FORBIDDEN» e um por papel; «CSRF: origem de outro site é recusada, mesmo com a sessão do administrador»; «toda Server Action de app/admin está nesta verificação» | C |
| Leitura e escrita direta com a chave anônima | N | `tests/e2e/acesso-indevido-dados.spec.ts` › «toda tabela e função exposta está classificada aqui»; «form_submissions: a chave anônima recebe 401, sem nenhuma linha» e uma por tabela; «cases: a chave anônima só lê o que está publicado» e uma por tabela; «services: a chave anônima não grava» e uma por tabela | C |
| Storage | N | `tests/e2e/acesso-indevido-dados.spec.ts` › «o bucket não lista para a chave anônima, embora o arquivo exista»; «tipo proibido é recusado pelo bucket, mesmo com permissão: text/html» e um por tipo | C |
| Conteúdo oculto por URL direta, com e sem `use cache` | N | `tests/e2e/acesso-indevido-dados.spec.ts` › «nenhuma rota de /api/v1 devolve conteúdo oculto, deduzidas dos arquivos»; «arquivado pelo painel: detalhe, API e listas param de mostrar, sem redeploy»; «arquivado direto no banco, sem invalidar: o proxy já responde 404 no detalhe» | C |
| Erro e arquivo interno | N | `tests/e2e/acesso-indevido-dados.spec.ts` › «404 API com travessia» e uma por resposta; «500 e 4xx de Server Action malformada não trazem pilha nem caminho»; «arquivo do projeto não é servido: /.env» e um por arquivo | E, C |
| Segredos no que chega ao navegador | N | `tests/e2e/acesso-indevido-dados.spec.ts` › «.next/static não traz segredo nem mapa de código»; «todo JavaScript que uma página carrega, seguido pelo navegador, não traz segredo» | E, C |
| Testes de acesso indevido em homologação | — | **Sem cobertura.** Depende de GO-02. O registro local está em [QA-06](qa-06-acesso-indevido.md) | — |

## 9. Lista de lacunas

Resumo do que está marcado como **sem cobertura**, para virar teste ou ser aceito como verificação manual.

| Lacuna | Critério | Quem pode fechar | Bloqueio externo |
| ------- | -------- | ------------------ | ----------------- |
| Filtros de serviço, área e cliente no navegador | CA-12 | QA-02 | — |
| Logout e renovação de sessão em homologação | CA-18 | ADM-02, QA-06 | Homologação (GO-02) |
| `/api/v1/health` | CA-29 | QA-11 | — |
| Contraste e Lighthouse | CA-07 | QA-07, SEG-07 | — |
| Envio real de e-mail | CA-15 | FORM-10, GO-05 | CON-10, GO-02 |
| Isolamento, domínio, smoke, restauração real, rollback | CA-24 a CA-27, CA-29 | GO-01, GO-02, GO-03, DB-10, QA-11 | Decisões da GO-02, CON-11 |
| Aceite de texto, cases e uso autônomo | CA-01 a CA-03, CA-09, CA-11, CA-13, CA-17, CA-20 | QA-09, GO-07 | CON-03 a CON-08, SEG-02 |

## 10. Em andamento

**Nada aqui conta como cobertura.** Estes temas têm branch ou PR aberto em 04/11/2026. Quando chegarem à `main`, abra os
testes e mova-os para as seções acima, com o nome exato.

| Tema | Referência | Critério afetado |
| ---- | ----------- | ------------------ |
| Tela de CTAs: o teste real de "alteração no painel reflete no site" | ADM-11, branch `feat/adm-11-ctas-e-destaques` | CA-20, INT-06 |
| Prévia protegida de rascunho: rota nova, a classificar em QA-06 | ADM-14, branch `feat/adm-14-previa-protegida` | Seção 8 |
| Exclusão de mídia: ação nova, a classificar em QA-06 | ADM-09, branch `feat/adm-09-remover-midia` | Seção 8 |
| Integridade de publicação no banco | PR #372 (DBX-04), que acrescenta `integridade_publicacao.test.sql` e `integridade-publicacao.test.ts` | CA-21, CMS |

Depois de QA-03, QA-05, QA-06 e INT-06, os testes novos saíram desta seção e estão em CA-04, CA-06, CA-16, CA-19 e na seção 8.
As verificações de QA-06 falham sozinhas quando uma rota ou Server Action nova chega sem classificação.

## 11. Evidência desta versão

Execução em 04/11/2026, no commit `8e55596` da branch de QA-03, QA-05, QA-06 e INT-06, com Node 22 e Supabase local.

| Bateria | Situação | Resultado |
| ------- | --------- | ---------- |
| `npm run verify` (inclui U) | ✅ Rodou | Cabeçalhos, formatação, tipos e lint sem erro; 1206 testes passaram e 167 foram ignorados, em 108 arquivos; build ok |
| G `npm run check:release-content` | ❌ Rodou e falhou, como esperado | 1 falhou, 347 passaram: há conteúdo provisório publicado (CA-28) |
| S `npm run test:supabase` | ✅ Rodou | 17 arquivos, 165 de 165 |
| D `npx supabase test db` | ✅ Rodou | `Files=10, Tests=260, Result: PASS` |
| E `npm run test:e2e` | ✅ Rodou | 437 passaram, 0 falharam, 699 pulados (`@cms` e o que não depende da largura) |
| C `npm run test:e2e:cms` | ✅ Rodou | 361 de 361 |

Registros: [QA-03](qa-03-responsividade.md), [QA-05](qa-05-formularios.md) e [QA-06 e INT-06](qa-06-acesso-indevido.md).


Como foi conferida: cada teste citado foi aberto, e os nomes foram comparados por script com a saída de
`vitest run --reporter=json`, `playwright test --list` e as descrições dos arquivos pgTAP.

Defeitos não entram aqui: seguem as tabelas da [QA-04 §4](qa-04-cms.md) e as issues `[BUG]`. A execução com evidência por
ambiente é da QA-05, QA-06, QA-09 e QA-11.

## 12. Manutenção

- Teste novo ligado a um critério entra aqui no mesmo PR, com o nome exato.
- Renomear ou apagar um teste citado exige atualizar esta matriz. Não há checagem automática.
- Mudou um critério em [GOV-13](../gestao/criterios-de-aceite.md)? Revise a linha aqui.
- Lacuna fechada sai da seção 9. Lacuna aceita como manual fica escrita como tal, nunca como "coberto".
