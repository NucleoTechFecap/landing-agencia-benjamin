/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261025000100_cms_content.sql
 Descrição    : Tabelas de conteúdo do CMS com constraints de integridade, estados de publicação e RLS por RBAC.

 Desenvolvedor: Vinícius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 25/10/2026
 Modificado em: 25/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 25/10/2026 Vinícius Binda             Criação inicial (DB-01/DBX-01/DB-02).
──────────────────────────────────────────────────────────────────────────────
*/

-- Conteúdo do CMS (DB-01/DBX-01). Modelo, cardinalidades e justificativas em
-- docs/banco/dicionario-de-dados.md. Espelha lib/domain/content/*: o teste
-- lib/server/content/content-sql.test.ts falha se estados, slugs ou mídia divergirem.
--
-- Convenções: exclusão lógica = status 'archived'; exclusão definitiva só de itens
-- arquivados (TECH-04). Usuários = public.profiles (0100); leads, contatos e feedbacks =
-- public.form_submissions (0400). Público lê somente o que está publicado (RN-01).

-- ─── Tipos e funções de apoio ────────────────────────────────────────────────

create type public.publish_status as enum ('draft', 'published', 'archived');

-- Mesma regra de validateSlug() (lib/domain/content/slug.ts).
create function public.is_valid_slug(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     and char_length(p_slug) between 3 and 80
     and p_slug <> all (array['admin', 'api', 'novo', 'nova', 'editar', 'new', 'edit', 'preview', 'rascunho', 'todos', 'filtro', 'pagina']);
$$;

-- Quem gravou por último. Gravações do servidor (service_role) mantêm o valor enviado.
create function public.stamp_updated_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by = coalesce((select auth.uid()), new.updated_by);
  return new;
end;
$$;

-- ─── Mídia (ADR-0005) ────────────────────────────────────────────────────────

-- Guarda o caminho, nunca a URL: chave do bucket "media" (AAAA/MM/<uuid>-<nome>.<ext>)
-- ou arquivo versionado em public/ (ex.: /brand/cases/capa.webp, sem tamanho conhecido).
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique check (char_length(path) <= 300 and path !~ '^[a-z][a-z0-9+.-]*:' and path !~ '\.\.'),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf')),
  size_bytes integer check (size_bytes > 0),
  width integer check (width between 1 and 4000),
  height integer check (height between 1 and 4000),
  alt_text text check (char_length(alt_text) <= 160),
  decorative boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint media_assets_extension check (
    substring(path from '\.([a-z0-9]+)$') = case mime_type
      when 'image/jpeg' then 'jpg'
      when 'image/png' then 'png'
      when 'image/webp' then 'webp'
      when 'image/avif' then 'avif'
      when 'application/pdf' then 'pdf'
    end
  ),
  constraint media_assets_size check (
    size_bytes <= case when mime_type = 'application/pdf' then 10485760 else 5242880 end
  ),
  constraint media_assets_dimensions check (mime_type <> 'application/pdf' or (width is null and height is null))
);

comment on table public.media_assets is 'Biblioteca de mídia do CMS. Exclusão bloqueada (FK restrict) enquanto o arquivo estiver em uso.';

-- ─── Áreas, serviços e vínculo N:M (PRJ §9/§10) ──────────────────────────────

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_valid_slug(slug)),
  name text not null check (char_length(name) between 2 and 120),
  summary text check (char_length(summary) <= 200),
  description text check (char_length(description) <= 4000),
  highlights text[] not null default '{}',
  icon text check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.publish_status not null default 'draft',
  provisional boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint areas_published_at check (status <> 'published' or published_at is not null),
  constraint areas_archived_at check ((status = 'archived') = (archived_at is not null)),
  constraint areas_publish_fields check (status <> 'published' or (summary is not null and description is not null))
);

comment on table public.areas is 'Áreas de atuação da agência. Agrupam serviços (N:M via service_areas).';

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_valid_slug(slug)),
  name text not null check (char_length(name) between 2 and 120),
  summary text check (char_length(summary) <= 200),
  description text check (char_length(description) <= 4000),
  examples text[] not null default '{}',
  icon text check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_media_id uuid references public.media_assets (id) on delete restrict,
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.publish_status not null default 'draft',
  provisional boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint services_published_at check (status <> 'published' or published_at is not null),
  constraint services_archived_at check ((status = 'archived') = (archived_at is not null)),
  constraint services_publish_fields check (status <> 'published' or (summary is not null and description is not null))
);

comment on table public.services is 'Serviços oferecidos. Pertencem a 1..N áreas (regra R03 validada na aplicação).';

create index services_image_idx on public.services (image_media_id);

create table public.service_areas (
  service_id uuid not null references public.services (id) on delete cascade,
  area_id uuid not null references public.areas (id) on delete cascade,
  primary key (service_id, area_id)
);

create index service_areas_area_idx on public.service_areas (area_id);

-- ─── Categorias, cases e vínculos (PRJ §12/§13, CASE-11) ─────────────────────

create table public.case_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_valid_slug(slug)),
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 4000),
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.publish_status not null default 'draft',
  provisional boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint case_categories_published_at check (status <> 'published' or published_at is not null),
  constraint case_categories_archived_at check ((status = 'archived') = (archived_at is not null))
);

comment on table public.case_categories is 'Categorias do portfólio. Cada case pertence a uma categoria (N:1).';

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_valid_slug(slug)),
  title text not null check (char_length(title) between 2 and 120),
  client_name text check (char_length(client_name) between 2 and 120),
  category_id uuid references public.case_categories (id) on delete restrict,
  delivery_type text check (char_length(delivery_type) <= 60),
  summary text check (char_length(summary) <= 280),
  challenge text check (char_length(challenge) <= 4000),
  solution text check (char_length(solution) <= 4000),
  results text check (char_length(results) <= 4000),
  cover_media_id uuid references public.media_assets (id) on delete restrict,
  external_links jsonb not null default '[]' check (
    jsonb_typeof(external_links) = 'array'
    and jsonb_array_length(external_links) <= 10
    and not jsonb_path_exists(
      external_links,
      '$[*] ? (!(@.url like_regex "^https://[^ ]+$") || !(@.label.type() == "string"))'
    )
  ),
  reference_month date check (extract(day from reference_month) = 1),
  team text[] not null default '{}' check (cardinality(team) <= 20),
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.publish_status not null default 'draft',
  provisional boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint cases_published_at check (status <> 'published' or published_at is not null),
  constraint cases_archived_at check ((status = 'archived') = (archived_at is not null)),
  -- Mínimo de casePublishSchema; "≥ 1 serviço publicado" (R07) fica na aplicação.
  constraint cases_publish_fields check (
    status <> 'published'
    or (client_name is not null
        and category_id is not null
        and coalesce(char_length(summary), 0) >= 30
        and cover_media_id is not null)
  )
);

comment on table public.cases is 'Cases do portfólio. Áreas do case são derivadas dos serviços (não gravadas).';

create index cases_category_idx on public.cases (category_id);
create index cases_cover_idx on public.cases (cover_media_id);

create table public.case_services (
  case_id uuid not null references public.cases (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (case_id, service_id)
);

create index case_services_service_idx on public.case_services (service_id);

create table public.case_media (
  case_id uuid not null references public.cases (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  primary key (case_id, media_id)
);

comment on table public.case_media is 'Galeria do case (até 20 itens, validado na aplicação).';

create index case_media_media_idx on public.case_media (media_id);

-- ─── Chamadas para ação (TECH-05) ────────────────────────────────────────────

-- Destino excluído vira órfão (set null): o site usa o fallback e o CMS sinaliza (R04).
create table public.ctas (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 2 and 40),
  placement text not null check (placement in ('home-hero', 'home-highlight', 'footer', 'service-detail', 'case-detail')),
  target_kind text not null check (target_kind in ('internal', 'external', 'service', 'case', 'area', 'contact')),
  target_path text check (char_length(target_path) <= 200 and target_path ~ '^/' and target_path !~ '^//'),
  target_url text check (char_length(target_url) <= 500 and target_url ~ '^https://[^[:space:]]+$'),
  target_service_id uuid references public.services (id) on delete set null,
  target_case_id uuid references public.cases (id) on delete set null,
  target_area_id uuid references public.areas (id) on delete set null,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.publish_status not null default 'draft',
  provisional boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint ctas_published_at check (status <> 'published' or published_at is not null),
  constraint ctas_archived_at check ((status = 'archived') = (archived_at is not null)),
  -- Cada tipo de destino usa somente a sua coluna; contato aceita serviço pré-selecionado.
  constraint ctas_target check (
    (target_path is not null) = (target_kind = 'internal')
    and (target_url is not null) = (target_kind = 'external')
    and (target_service_id is null or target_kind in ('service', 'contact'))
    and (target_case_id is null or target_kind = 'case')
    and (target_area_id is null or target_kind = 'area')
  )
);

create index ctas_placement_idx on public.ctas (placement, sort_order);
create index ctas_service_idx on public.ctas (target_service_id) where target_service_id is not null;
create index ctas_case_idx on public.ctas (target_case_id) where target_case_id is not null;
create index ctas_area_idx on public.ctas (target_area_id) where target_area_id is not null;

-- ─── Páginas e blocos (DB-01) ────────────────────────────────────────────────

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_valid_slug(slug)),
  title text not null check (char_length(title) between 2 and 120),
  description text check (char_length(description) <= 300),
  status public.publish_status not null default 'draft',
  provisional boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint pages_published_at check (status <> 'published' or published_at is not null),
  constraint pages_archived_at check ((status = 'archived') = (archived_at is not null))
);

comment on table public.pages is 'Páginas editáveis do site. Os blocos seguem o estado da página.';

-- Bloco não tem estado próprio: é visível quando a página está publicada.
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  type text not null check (char_length(type) <= 40 and type ~ '^[a-z]+(-[a-z]+)*$'),
  content jsonb not null default '{}' check (jsonb_typeof(content) = 'object'),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index blocks_page_idx on public.blocks (page_id, sort_order);

-- ─── Configuração institucional (ADM-10) ─────────────────────────────────────

-- Linha única (id = true). Textos aninhados seguem SiteSettings em lib/domain/content/types.ts.
create table public.site_settings (
  id boolean primary key default true check (id),
  name text not null check (char_length(name) between 2 and 120),
  short_name text not null check (char_length(short_name) between 2 and 40),
  tagline text not null check (char_length(tagline) <= 120),
  description text not null check (char_length(description) <= 300),
  manifesto jsonb not null default '{}' check (jsonb_typeof(manifesto) = 'object'),
  about jsonb not null default '{}' check (jsonb_typeof(about) = 'object'),
  contact jsonb not null default '{}' check (jsonb_typeof(contact) = 'object'),
  socials jsonb not null default '{}' check (jsonb_typeof(socials) = 'object'),
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ─── Triggers de controle ────────────────────────────────────────────────────

create trigger media_assets_touch_updated_at before update on public.media_assets
  for each row execute function public.touch_updated_at();
create trigger areas_touch_updated_at before update on public.areas
  for each row execute function public.touch_updated_at();
create trigger services_touch_updated_at before update on public.services
  for each row execute function public.touch_updated_at();
create trigger case_categories_touch_updated_at before update on public.case_categories
  for each row execute function public.touch_updated_at();
create trigger cases_touch_updated_at before update on public.cases
  for each row execute function public.touch_updated_at();
create trigger ctas_touch_updated_at before update on public.ctas
  for each row execute function public.touch_updated_at();
create trigger pages_touch_updated_at before update on public.pages
  for each row execute function public.touch_updated_at();
create trigger blocks_touch_updated_at before update on public.blocks
  for each row execute function public.touch_updated_at();
create trigger site_settings_touch_updated_at before update on public.site_settings
  for each row execute function public.touch_updated_at();

create trigger media_assets_stamp_updated_by before insert or update on public.media_assets
  for each row execute function public.stamp_updated_by();
create trigger areas_stamp_updated_by before insert or update on public.areas
  for each row execute function public.stamp_updated_by();
create trigger services_stamp_updated_by before insert or update on public.services
  for each row execute function public.stamp_updated_by();
create trigger case_categories_stamp_updated_by before insert or update on public.case_categories
  for each row execute function public.stamp_updated_by();
create trigger cases_stamp_updated_by before insert or update on public.cases
  for each row execute function public.stamp_updated_by();
create trigger ctas_stamp_updated_by before insert or update on public.ctas
  for each row execute function public.stamp_updated_by();
create trigger pages_stamp_updated_by before insert or update on public.pages
  for each row execute function public.stamp_updated_by();
create trigger blocks_stamp_updated_by before insert or update on public.blocks
  for each row execute function public.stamp_updated_by();
create trigger site_settings_stamp_updated_by before insert or update on public.site_settings
  for each row execute function public.stamp_updated_by();

-- ─── Privilégios e RLS ───────────────────────────────────────────────────────

-- Visitante só lê; o painel grava conforme a matriz RBAC (has_permission). TRUNCATE e
-- demais privilégios padrão do Supabase são retirados (não passam por RLS).
revoke all on table
  public.media_assets, public.areas, public.services, public.service_areas, public.case_categories,
  public.cases, public.case_services, public.case_media, public.ctas, public.pages, public.blocks,
  public.site_settings
  from anon, authenticated;

grant select on table
  public.media_assets, public.areas, public.services, public.service_areas, public.case_categories,
  public.cases, public.case_services, public.case_media, public.ctas, public.pages, public.blocks,
  public.site_settings
  to anon;

grant select, insert, update, delete on table
  public.media_assets, public.areas, public.services, public.service_areas, public.case_categories,
  public.cases, public.case_services, public.case_media, public.ctas, public.pages, public.blocks
  to authenticated;

grant select, insert, update on table public.site_settings to authenticated;

alter table public.media_assets enable row level security;
alter table public.areas enable row level security;
alter table public.services enable row level security;
alter table public.service_areas enable row level security;
alter table public.case_categories enable row level security;
alter table public.cases enable row level security;
alter table public.case_services enable row level security;
alter table public.case_media enable row level security;
alter table public.ctas enable row level security;
alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.site_settings enable row level security;

-- Padrão das entidades publicáveis: público lê publicados com data já alcançada; painel lê
-- com <recurso>:view; criação nasce rascunho; publicar/arquivar exige a permissão da
-- transição; exclusão definitiva só de arquivados. Validação de transição: DBX-04.

-- areas
create policy "areas: público lê publicados" on public.areas
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "areas: painel lê" on public.areas
  for select to authenticated using (public.has_permission('area', 'view'));
create policy "areas: cria rascunho" on public.areas
  for insert to authenticated with check (public.has_permission('area', 'create') and status = 'draft');
create policy "areas: edita" on public.areas
  for update to authenticated
  using (public.has_permission('area', 'edit'))
  with check (public.has_permission('area', 'edit')
              and (status <> 'published' or public.has_permission('area', 'publish'))
              and (status <> 'archived' or public.has_permission('area', 'archive')));
create policy "areas: exclui arquivados" on public.areas
  for delete to authenticated using (public.has_permission('area', 'delete') and status = 'archived');

-- services
create policy "services: público lê publicados" on public.services
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "services: painel lê" on public.services
  for select to authenticated using (public.has_permission('service', 'view'));
create policy "services: cria rascunho" on public.services
  for insert to authenticated with check (public.has_permission('service', 'create') and status = 'draft');
create policy "services: edita" on public.services
  for update to authenticated
  using (public.has_permission('service', 'edit'))
  with check (public.has_permission('service', 'edit')
              and (status <> 'published' or public.has_permission('service', 'publish'))
              and (status <> 'archived' or public.has_permission('service', 'archive')));
create policy "services: exclui arquivados" on public.services
  for delete to authenticated using (public.has_permission('service', 'delete') and status = 'archived');

-- service_areas: vínculo público só entre serviço e área publicados.
create policy "service_areas: público lê vínculos publicados" on public.service_areas
  for select to anon, authenticated
  using (exists (select 1 from public.services s
                 where s.id = service_id and s.status = 'published' and s.published_at <= now())
         and exists (select 1 from public.areas a
                     where a.id = area_id and a.status = 'published' and a.published_at <= now()));
create policy "service_areas: painel lê" on public.service_areas
  for select to authenticated using (public.has_permission('service', 'view'));
create policy "service_areas: vincula" on public.service_areas
  for insert to authenticated with check (public.has_permission('service', 'edit'));
create policy "service_areas: desvincula" on public.service_areas
  for delete to authenticated using (public.has_permission('service', 'edit'));

-- case_categories
create policy "case_categories: público lê publicados" on public.case_categories
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "case_categories: painel lê" on public.case_categories
  for select to authenticated using (public.has_permission('category', 'view'));
create policy "case_categories: cria rascunho" on public.case_categories
  for insert to authenticated with check (public.has_permission('category', 'create') and status = 'draft');
create policy "case_categories: edita" on public.case_categories
  for update to authenticated
  using (public.has_permission('category', 'edit'))
  with check (public.has_permission('category', 'edit')
              and (status <> 'published' or public.has_permission('category', 'publish'))
              and (status <> 'archived' or public.has_permission('category', 'archive')));
create policy "case_categories: exclui arquivados" on public.case_categories
  for delete to authenticated using (public.has_permission('category', 'delete') and status = 'archived');

-- cases
create policy "cases: público lê publicados" on public.cases
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "cases: painel lê" on public.cases
  for select to authenticated using (public.has_permission('case', 'view'));
create policy "cases: cria rascunho" on public.cases
  for insert to authenticated with check (public.has_permission('case', 'create') and status = 'draft');
create policy "cases: edita" on public.cases
  for update to authenticated
  using (public.has_permission('case', 'edit'))
  with check (public.has_permission('case', 'edit')
              and (status <> 'published' or public.has_permission('case', 'publish'))
              and (status <> 'archived' or public.has_permission('case', 'archive')));
create policy "cases: exclui arquivados" on public.cases
  for delete to authenticated using (public.has_permission('case', 'delete') and status = 'archived');

-- case_services: vínculo público só entre case e serviço publicados.
create policy "case_services: público lê vínculos publicados" on public.case_services
  for select to anon, authenticated
  using (exists (select 1 from public.cases c
                 where c.id = case_id and c.status = 'published' and c.published_at <= now())
         and exists (select 1 from public.services s
                     where s.id = service_id and s.status = 'published' and s.published_at <= now()));
create policy "case_services: painel lê" on public.case_services
  for select to authenticated using (public.has_permission('case', 'view'));
create policy "case_services: vincula" on public.case_services
  for insert to authenticated with check (public.has_permission('case', 'edit'));
create policy "case_services: desvincula" on public.case_services
  for delete to authenticated using (public.has_permission('case', 'edit'));

-- case_media: galeria pública só de case publicado.
create policy "case_media: público lê galeria publicada" on public.case_media
  for select to anon, authenticated
  using (exists (select 1 from public.cases c
                 where c.id = case_id and c.status = 'published' and c.published_at <= now()));
create policy "case_media: painel lê" on public.case_media
  for select to authenticated using (public.has_permission('case', 'view'));
create policy "case_media: adiciona" on public.case_media
  for insert to authenticated with check (public.has_permission('case', 'edit'));
create policy "case_media: reordena" on public.case_media
  for update to authenticated
  using (public.has_permission('case', 'edit'))
  with check (public.has_permission('case', 'edit'));
create policy "case_media: remove" on public.case_media
  for delete to authenticated using (public.has_permission('case', 'edit'));

-- media_assets: o público só enxerga metadados de mídia usada por conteúdo publicado
-- (evita listar arquivos de rascunhos). Escrita conforme media:* (ADR-0005).
create policy "media_assets: público lê mídia publicada" on public.media_assets
  for select to anon, authenticated
  using (exists (select 1 from public.cases c
                 where c.cover_media_id = media_assets.id and c.status = 'published' and c.published_at <= now())
         or exists (select 1 from public.case_media cm join public.cases c on c.id = cm.case_id
                    where cm.media_id = media_assets.id and c.status = 'published' and c.published_at <= now())
         or exists (select 1 from public.services s
                    where s.image_media_id = media_assets.id and s.status = 'published' and s.published_at <= now()));
create policy "media_assets: painel lê" on public.media_assets
  for select to authenticated using (public.has_permission('media', 'view'));
create policy "media_assets: registra upload" on public.media_assets
  for insert to authenticated with check (public.has_permission('media', 'create'));
create policy "media_assets: edita" on public.media_assets
  for update to authenticated
  using (public.has_permission('media', 'edit'))
  with check (public.has_permission('media', 'edit'));
create policy "media_assets: exclui" on public.media_assets
  for delete to authenticated using (public.has_permission('media', 'delete'));

-- ctas
create policy "ctas: público lê publicados" on public.ctas
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "ctas: painel lê" on public.ctas
  for select to authenticated using (public.has_permission('cta', 'view'));
create policy "ctas: cria rascunho" on public.ctas
  for insert to authenticated with check (public.has_permission('cta', 'create') and status = 'draft');
create policy "ctas: edita" on public.ctas
  for update to authenticated
  using (public.has_permission('cta', 'edit'))
  with check (public.has_permission('cta', 'edit')
              and (status <> 'published' or public.has_permission('cta', 'publish'))
              and (status <> 'archived' or public.has_permission('cta', 'archive')));
create policy "ctas: exclui arquivados" on public.ctas
  for delete to authenticated using (public.has_permission('cta', 'delete') and status = 'archived');

-- pages
create policy "pages: público lê publicadas" on public.pages
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "pages: painel lê" on public.pages
  for select to authenticated using (public.has_permission('page', 'view'));
create policy "pages: cria rascunho" on public.pages
  for insert to authenticated with check (public.has_permission('page', 'create') and status = 'draft');
create policy "pages: edita" on public.pages
  for update to authenticated
  using (public.has_permission('page', 'edit'))
  with check (public.has_permission('page', 'edit')
              and (status <> 'published' or public.has_permission('page', 'publish'))
              and (status <> 'archived' or public.has_permission('page', 'archive')));
create policy "pages: exclui arquivadas" on public.pages
  for delete to authenticated using (public.has_permission('page', 'delete') and status = 'archived');

-- blocks: herdam a visibilidade da página; editar blocos = editar a página.
create policy "blocks: público lê blocos de páginas publicadas" on public.blocks
  for select to anon, authenticated
  using (exists (select 1 from public.pages p
                 where p.id = page_id and p.status = 'published' and p.published_at <= now()));
create policy "blocks: painel lê" on public.blocks
  for select to authenticated using (public.has_permission('page', 'view'));
create policy "blocks: cria" on public.blocks
  for insert to authenticated with check (public.has_permission('page', 'edit'));
create policy "blocks: edita" on public.blocks
  for update to authenticated
  using (public.has_permission('page', 'edit'))
  with check (public.has_permission('page', 'edit'));
create policy "blocks: exclui" on public.blocks
  for delete to authenticated using (public.has_permission('page', 'edit'));

-- site_settings: conteúdo institucional público; somente settings:edit altera.
create policy "site_settings: leitura pública" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: cria" on public.site_settings
  for insert to authenticated with check (public.has_permission('settings', 'edit'));
create policy "site_settings: edita" on public.site_settings
  for update to authenticated
  using (public.has_permission('settings', 'edit'))
  with check (public.has_permission('settings', 'edit'));
