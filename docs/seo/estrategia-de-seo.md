# SEO, compartilhamento e descoberta por IA

| Campo        | Valor                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| Relacionado  | SEG-09 (#103), QA-07 (#185), RNF-05                                        |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`) — estrutura da landing           |
| Versão       | 1.0.0                                                                     |
| Data         | 13/10/2026                                                                |

## 1. O que está implementado

| Recurso | Onde | Observação |
| ------- | ---- | ---------- |
| Título com template `%s \| Agência Benjamin`, descrição, keywords, autor/publisher | `app/layout.tsx` + `buildMetadata()` (`lib/server/seo.ts`) | Keywords globais vêm do conteúdo (`settings.keywords`) e somam as da página |
| Canonical por página | `alternates.canonical` | Base `NEXT_PUBLIC_SITE_URL` |
| Open Graph (`og:title`, `og:description`, `og:url`, `og:locale=pt_BR`, `og:type`, `og:image`) e Twitter Card `summary_large_image` | `buildMetadata()` | Detalhe de case usa `type: article` |
| Imagens de compartilhamento dinâmicas 1200×630 | `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `servicos/[slug]/opengraph-image.tsx`, `cases/[slug]/opengraph-image.tsx` | Poppins Black/Bold empacotada (`assets/fonts`, licença OFL) |
| Dados estruturados (JSON-LD) | `lib/domain/seo/structured-data.ts`, `components/seo/json-ld.tsx` | `Organization` (com FECAP como `parentOrganization` e redes em `sameAs`), `WebSite`, `BreadcrumbList` (páginas internas), `ItemList` (serviços e cases), `Service`, `CreativeWork` |
| `sitemap.xml` | `app/sitemap.ts` | Somente serviços/cases publicados; `lastModified` = `updatedAt`; imagem da capa |
| `robots.txt` | `app/robots.ts` | Produção: permite tudo exceto `/admin` e `/api/internal`; demais ambientes: `Disallow: /` |
| `llms.txt` e `llms-full.txt` | `app/llms.txt`, `app/llms-full.txt`, `lib/server/llms.ts` | Padrão llmstxt.org: resumo e conteúdo completo publicado para assistentes de IA |
| Manifest web | `app/manifest.ts` | Nome, cores da marca, ícones |
| Ícones | `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | Símbolo do logotipo, gerado do vetor oficial (`public/brand/logos/simbolo.svg`) |
| `X-Robots-Tag` | `next.config.ts` | `noindex, nofollow` fora de produção e sempre em `/admin` |
| 404 real | `proxy.ts` | Slug inexistente/arquivado responde HTTP 404 (evita *soft 404*) |
| HTML semântico | Páginas | Um `h1` por página, `lang="pt-BR"`, `alt` em imagens informativas, breadcrumbs |

## 2. Palavras-chave

Globais (editáveis no conteúdo): Agência Benjamin, Benja, agência experimental FECAP, agência de
comunicação São Paulo, estratégia digital, social media, produção de conteúdo, copywriting, design e
identidade visual, audiovisual, eventos e parcerias, assessoria de imprensa, comunicação interna,
portfólio e cases de comunicação. Cada página acrescenta termos próprios (nome do serviço, áreas,
entregas, cliente do case).

## 3. Verificação (build de produção local)

- Desenvolvimento: `robots.txt` com `Disallow: /`, meta `noindex, nofollow` e `X-Robots-Tag`.
- `NEXT_PUBLIC_SITE_ENV=production`: `robots.txt` com `Allow: /`, `Disallow: /admin`, sitemap e host;
  meta `index, follow`; canonical absoluto; sem `X-Robots-Tag` nas páginas públicas.
- `sitemap.xml` com 20 URLs; `/llms.txt` e `/llms-full.txt` (172 linhas) gerados do conteúdo publicado.
- OG de serviço/case: `200 image/png`.

## 4. Checklist antes do go-live (QA-07)

- [ ] `NEXT_PUBLIC_SITE_URL` com o domínio oficial (GO-03) — canonical, sitemap e OG dependem dele.
- [ ] Validar JSON-LD no [Rich Results Test](https://search.google.com/test/rich-results) e no Schema Markup Validator.
- [ ] Testar compartilhamento no LinkedIn Post Inspector e no Facebook Sharing Debugger.
- [ ] Enviar `sitemap.xml` ao Google Search Console (propriedade do domínio — Benjamin).
- [ ] Rodar Lighthouse (SEO ≥ 95, Acessibilidade ≥ 95) em mobile.
- [ ] Remover conteúdo provisório (`npm run check:release-content`).
