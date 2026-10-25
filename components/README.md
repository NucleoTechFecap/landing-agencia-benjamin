# components/

Componentes React reutilizáveis. Organização:

- `ui/` — primitivas do design system (botões, seções, badges, ícones).
- `cards/` — cartões de conteúdo (área, serviço, case).
- `layout/` — header, footer, navegação e elementos estruturais.
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
| `ProvisionalBadge` | Selo "Conteúdo provisório" para textos ainda não aprovados | `className` | 10 |
| `BrandIcon` | Ícone oficial do brandbook (`public/brand/icons`), decorativo por padrão | `name`, `color`, `size`, `alt` | 12 |
| `Sticker` | Sticker da identidade (`public/brand/stickers`), sempre decorativo | `name`, `color`, `width`, `anchor` (`top` \| `bottom`) | 7 |
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
| `PageHero` | Topo das páginas internas: breadcrumbs, `h1`, descrição, ícone e selo provisório | 9 |
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

## Cuidados

- **`className` não substitui classes do componente, só soma.** `ButtonLink` e `Section` juntam
  o `className` recebido às classes próprias. Se as duas definem a mesma propriedade (ex.:
  `hidden` × `inline-flex`, `px-5` × `px-6`), vence a que vier depois no CSS gerado, e não a
  que você passou. Para esconder ou mostrar um componente por breakpoint, envolva-o em um
  elemento com a classe de visibilidade (ver `SiteHeader`, LAY-02).
- **Imagens decorativas** (`BrandIcon`, `Sticker`) usam caixa fixa com `object-contain`; não
  passe altura por CSS, para não reintroduzir o aviso "width or height modified" do
  `next/image` (LAY-06).
- **Conteúdo provisório** deve sempre exibir `ProvisionalBadge` até a aprovação da agência.