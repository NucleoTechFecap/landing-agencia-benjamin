# components/

Componentes React reutilizáveis. Organização:

- `ui/` — primitivas do design system (botões, seções, badges, ícones).
- `cards/` — cartões de conteúdo (área, serviço, case).
- `layout/` — header, footer, navegação e elementos estruturais.
- `motion/` — animações com GSAP, carregadas fora do bundle principal (ver [abaixo](#motion--animações)).
- `sections/` — blocos de página (hero, manifesto, CTA final, filtros).
- `forms/` — formulários públicos (Client Components com `useActionState`).
- `seo/` — dados estruturados (JSON-LD) e imagens de compartilhamento.
- `admin/` — telas de acesso do painel.

Regras: Server Component por padrão; marque `'use client'` só quando houver estado, efeito ou
evento. Nenhum componente acessa banco diretamente — dados chegam por props.

Antes de criar um componente novo, procure aqui um que já resolva. Ao criar ou alterar um
componente reutilizável, atualize esta lista.

## ui/ — primitivas

| Componente | Para que serve | Props principais | Telas |
| ---------- | -------------- | ---------------- | ----- |
| `Container` | Largura máxima e margem lateral responsiva (16/24/32 px) | `className` | 13 |
| `Section` | Seção com tom de cor do brandbook e halftone opcional; já inclui `Container` | `tone` (`nyanza`, `verde`, `lima`, `claro`, `laranja`, `azul`, `rosa`, `creme`), `halftone`, `labelledBy`, `containerClassName` | 12 |
| `SectionHeading` | Título de seção com sobretítulo e descrição | `title`, `eyebrow`, `description`, `align`, `as` (`h1` \| `h2`), `id` | 4 |
| `ButtonLink` | Link com visual de botão "sticker" (interno ou externo) | `href`, `variant` (`primary`, `secondary`, `lima`, `ghost`), `external`, `prefetch` | 10 |
| `Badge` | Etiqueta arredondada (categoria, tipo, data) | `className` | 4 |
| `BrandIcon` | Ícone oficial do brandbook em SVG (`public/brand/icons`), decorativo por padrão | `name`, `color`, `size`, `alt` | 12 |
| `Sticker` | Sticker da identidade em SVG (`public/brand/stickers`), sempre decorativo | `name`, `color`, `width`, `anchor` (`top` \| `bottom`) | 7 |
| `Breadcrumbs` | Trilha de navegação; a última entrada é a página atual | `items` (`{ label, href? }[]`) | 9 |

## cards/

| Componente | Para que serve | Props principais | Telas |
| ---------- | -------------- | ---------------- | ----- |
| `AreaCard` | Card compacto de área; leva para `/areas#<slug>` | `area`, `color` | 2 (Home, Sobre) |
| `ServiceCard` | Card de serviço; leva para `/servicos/<slug>` | `service`, `index`, `headingLevel` | 2 (Home, Serviços) |
| `CaseCard` | Card de case com capa, cliente, categoria e resumo | `item`, `headingLevel`, `priority` | 4 |

## sections/

| Componente | Para que serve | Telas |
| ---------- | -------------- | ----- |
| `PageHero` | Topo das páginas internas: breadcrumbs, `h1`, descrição e ícone | 9 |
| `ClosingCta` | Faixa final laranja de conversão (contato/projeto) | 7 |
| `HeroManifesto` | Primeira dobra da Home: manifesto e CTAs principais | Home |
| `AboutPreview` | Bloco "Quem é a Benjamin" | Home |
| `ProcessSteps` | Etapas de trabalho da agência | Serviços |
| `CaseFilters` | Filtros do portfólio (funciona sem JavaScript) | Cases |

## layout/

`SiteHeader`, `NavLinks`, `MobileMenu`, `SkipLink`, `SiteFooter` e `SocialLinks` montam a
estrutura comum do site público (`app/(site)/layout.tsx`) e da página 404.

## forms/

`LeadForm` (Quero um projeto), `ContactForm` (Fale com a gente) e `FeedbackForm` são montados
com as peças compartilhadas de `fields.tsx` (`TextField`, `TextArea`, `SelectField`,
`CheckboxField`, `HoneypotField`) e `form-parts.tsx` (`FormErrorBanner`, `FormSuccess`,
`SubmitButton`, `PrivacyConsentText`, `TechnicalFields`), usadas em Contato e Feedback.

## motion/ — animações

Os componentes de servidor só declaram o efeito; `engine.tsx` e `scene.ts` fazem o resto
([ADR-0008](../docs/adr/0008-animacoes-com-gsap.md)). Para animar algo novo, use um destes atributos:

| Atributo | Efeito |
| -------- | ------ |
| `data-motion="heading"` | Em um bloco de título (`SectionHeading`): sobretítulo, título linha a linha e descrição |
| `data-motion="lines"` | Título sozinho, linha a linha por máscara. Só em títulos: não use em parágrafos longos |
| `data-motion="reveal"` | Bloco sobe e aparece ao entrar na tela |
| `data-motion="group"` | Filhos diretos entram em sequência |
| `data-motion="cards"` | Grade de cards: os filhos diretos entram tortos e assentam (efeito "sticker"). O card fica dentro do item, nunca no próprio item |
| `data-motion="pop"` | Ícone ou sticker entra com giro e escala |
| `data-motion="image"` | Imagem revelada por máscara, com zoom |
| `data-motion="steps"` | Etapas que acendem com a seção presa (desktop com altura suficiente) |
| `data-motion="intro-*"` + `data-at` | Primeira dobra: `intro-fade`, `intro-lines`, `intro-cta`, `intro-logo`, `intro-sticker`, `intro-icon`, começando em `data-at` segundos |
| `data-card` · `data-card="soft"` | Hover do card; `soft` é a versão discreta, para cards que não são links. Dentro dele: `data-card-icon`, `data-card-arrow`, `data-card-media` |
| `data-magnetic` | Botão com efeito magnético (já vem em `ButtonLink`) |
| `data-parallax="-30"` | Desloca o elemento em px durante a rolagem, de 768 px para cima |
| `data-float` | Flutuação leve enquanto está na tela |
| `data-clip-reveal` | Seção se expande ao entrar na tela (`ClosingCta`) |
| `data-wave` | Textura halftone em movimento, nos fundos verdes (`Section tone="verde"` com `halftone`) |
| `data-nudge` | Aviso que entra já visível: erros e confirmações nunca começam ocultos |

Regras:

- Elemento com `data-motion` começa com `opacity: 0`, e o motor define o valor final. Se ele tem
  opacidade própria (`opacity-90`), envolva-o em um `<div>` e coloque o atributo no `<div>`.
- Um elemento com transformação do GSAP não pode ter `transition` de `transform` em CSS: use
  `transition-[...]` só com o que precisa, ou a variante `motion-off:`.
- `motion-on:` e `motion-off:` aplicam classes com as animações ligadas ou desligadas (sem JavaScript,
  movimento reduzido ou falha do motor). O site precisa funcionar nos dois estados.
- `PageReady` precisa estar dentro da página: já vem em `PageHero` e `HeroManifesto`. Uma página sem
  nenhum dos dois espera até 1,5 s antes de animar.
- Só `components/motion/gsap.ts` importa o GSAP, para ele não entrar no bundle principal.
- Efeito novo que desloque um elemento de lugar passa por `whenReleased` (`scene.ts`): se ele começar
  durante um clique, o botão solta fora do link e o navegador descarta o clique.

## Cuidados

- **`className` não substitui classes do componente, só soma.** `ButtonLink` e `Section` juntam
  o `className` recebido às classes próprias. Se as duas definem a mesma propriedade (ex.:
  `hidden` × `inline-flex`, `px-5` × `px-6`), vence a que vier depois no CSS gerado, e não a
  que você passou. Para esconder ou mostrar um componente por breakpoint, envolva-o em um
  elemento com a classe de visibilidade (ver `SiteHeader`, LAY-02).
- **Imagens decorativas** (`BrandIcon`, `Sticker`) usam caixa fixa com `object-contain`; não
  passe altura por CSS, para não reintroduzir o aviso "width or height modified" do
  `next/image` (LAY-06).
- **Conteúdo provisório** não tem selo no site público: fica sinalizado no painel (`StatusBadge`) e o
  gate de release (`npm run check:release-content`) barra o go-live.