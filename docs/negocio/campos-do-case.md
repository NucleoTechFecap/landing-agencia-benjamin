# Campos e status de publicação do case no CMS

| Campo        | Valor                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Issue        | CASE-11 (#166)                                                         |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                               |
| Versão       | 1.0.0                                                                  |
| Data         | 13/10/2026                                                             |
| Origem       | PRJ §11–§13 (estrutura sugerida para cadastro de case)                 |
| Depende de   | DB-01 (modelagem — `@VinnizzZ`), GOV-03 (escopo)                       |
| Código       | `lib/domain/content/case-schema.ts` + testes; tipo `CaseStudy` em `types.ts` |

## 1. Princípio

O case pode ser **salvo como rascunho com o mínimo** (título e slug), porque o material da
Benjamin chega aos poucos (CON-06…08). Para **publicar**, exige-se apenas o que todo case precisa
para fazer sentido no site — sem tornar obrigatórios campos que nem todo trabalho tem
(ex.: um conjunto de artigos de copywriting não tem "resultados" numéricos).

## 2. Campos

| Campo (PRJ §13) | Código | Tipo | Rascunho | Publicar | Limite / regra | Exibição no site |
| --------------- | ------ | ---- | :------: | :------: | -------------- | ---------------- |
| Título | `title` | texto | **O** | **O** | 2–120 | Título da página e do card |
| — (URL) | `slug` | texto | **O** | **O** | kebab-case, 3–80, único | `/cases/<slug>` |
| Cliente | `client` | texto | Op | **O** | 2–120 | Card e cabeçalho |
| Categoria | `categoryId` | ref. | Op | **O** | categoria publicada | Filtro e selo |
| Serviço relacionado | `serviceIds` | ref. N:M | Op | **O** (≥ 1) | serviços publicados (TECH-05) | "Serviços envolvidos" + filtro |
| Tipo de entrega | `deliveryType` | texto | Op | Op | até 60 (ex.: "Artigos para blog") | Selo no card |
| Descrição | `summary` | texto | Op | **O** | 30–280 | Card, meta description e Open Graph |
| Desafio | `challenge` | texto longo | Op | Op | até 4 000 | Seção "Desafio" (omitida se vazia) |
| Solução | `solution` | texto longo | Op | Op | até 4 000 | Seção "Solução" (omitida se vazia) |
| Resultados | `results` | texto longo | Op | Op | até 4 000 | Seção "Resultados" (omitida se vazia) |
| Imagens (capa) | `cover` | mídia | Op | **O** | `alt` obrigatório; ARC-10 | Card, topo e imagem OG |
| Galeria | `gallery[]` | mídia | Op | Op | até 20; `alt` obrigatório | Galeria (CASE-04) |
| Links externos | `externalLinks[]` | {rótulo, url} | Op | Op | até 10; somente `https` | "Veja publicado" |
| Data | `date` | AAAA-MM | Op | Op | não futura | "Outubro de 2026" |
| Equipe envolvida | `team[]` | nomes | Op | Op | até 20 nomes | "Quem fez" (somente com autorização dos integrantes) |
| Destaque | `featured` | booleano | — | — | máx. 6 na Home (R11) | Seção de destaques |
| Ordem | `order` | inteiro | — | — | ≥ 0 | Ordenação |
| Status de publicação | `status` | enum | `draft` | `published` | ADM-12/TECH-04 | — |

Campos de controle comuns (`published_at`, `archived_at`, `updated_at`, `updated_by`) seguem o
[fluxo de publicação](fluxo-de-publicacao.md).

## 3. Status de publicação do case

| Estado | Quando | No site |
| ------ | ------ | ------- |
| `draft` | Material incompleto ou aguardando validação da Benjamin | Invisível; URL retorna 404 |
| `published` | Material validado e campos de publicação completos | Listagem, detalhe, sitemap, `llms.txt` |
| `archived` | Case retirado do portfólio (ex.: cliente pediu) | Invisível; CTAs usam fallback `/cases` |

Transições, permissões e invariantes: [máquina de estados](maquina-de-estados-publicacao.md).
A validação de publicação (`validateCaseForPublish`) é a função `validateForPublish` usada pela
transição `publish`/`save` de item publicado.

## 4. Sugestão de colunas para DB-01

```sql
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  client text,
  category_id uuid references public.case_categories (id) on delete restrict,
  delivery_type text,
  summary text check (summary is null or char_length(summary) <= 280),
  challenge text, solution text, results text,
  cover_path text, cover_alt text,
  external_links jsonb not null default '[]',
  reference_month date,            -- dia 1 do mês
  team text[] not null default '{}',
  featured boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz, archived_at timestamptz,
  updated_at timestamptz not null default now(), updated_by uuid references auth.users (id),
  check (status <> 'published' or (client is not null and category_id is not null
         and summary is not null and cover_path is not null and cover_alt is not null))
);
create table public.case_services (case_id uuid references public.cases on delete cascade,
  service_id uuid references public.services on delete cascade, primary key (case_id, service_id));
create table public.case_media (id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases on delete cascade,
  path text not null, alt text not null, sort_order integer not null default 0);
```

O banco garante o mínimo (constraint de publicação); a regra "≥ 1 serviço publicado" é verificada
na aplicação (TECH-05, R07), pois envolve outra tabela.
