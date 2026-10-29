/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000200_dbx03_indices_rls.sql
 Descrição    : Índices das FKs de autoria e leitura do painel com uma política por papel e has_permission avaliado uma vez.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-03).
──────────────────────────────────────────────────────────────────────────────
*/

-- Otimização de índices e consultas (DBX-03). Medições antes/depois e justificativa de cada
-- índice em docs/banco/dicionario-de-dados.md §10 (roteiro: npm run perf:queries).
--
-- Nada muda em quem lê o quê: as condições de cada política são as mesmas, só reorganizadas.

-- ─── 1. Índices das FKs de autoria ───────────────────────────────────────────

-- Excluir uma conta anula updated_by/invited_by (on delete set null). Sem índice, cada tabela era
-- lida inteira para achar as linhas da conta. Parciais: só linhas com autor entram no índice, e a
-- busca da FK (updated_by = $1) usa o índice mesmo assim.
create index media_assets_updated_by_idx on public.media_assets (updated_by) where updated_by is not null;
create index areas_updated_by_idx on public.areas (updated_by) where updated_by is not null;
create index services_updated_by_idx on public.services (updated_by) where updated_by is not null;
create index case_categories_updated_by_idx on public.case_categories (updated_by) where updated_by is not null;
create index cases_updated_by_idx on public.cases (updated_by) where updated_by is not null;
create index ctas_updated_by_idx on public.ctas (updated_by) where updated_by is not null;
create index pages_updated_by_idx on public.pages (updated_by) where updated_by is not null;
create index blocks_updated_by_idx on public.blocks (updated_by) where updated_by is not null;
create index site_settings_updated_by_idx on public.site_settings (updated_by) where updated_by is not null;
create index profiles_invited_by_idx on public.profiles (invited_by) where invited_by is not null;

-- Biblioteca do painel (order by created_at desc). Sem índice, com dezenas de milhares de
-- arquivos a ordenação passava da memória de trabalho e ia para disco.
create index media_assets_created_idx on public.media_assets (created_at desc);

-- ─── 2. Leitura: uma política por papel ──────────────────────────────────────

-- Antes, quem estava logado passava por duas políticas de SELECT ("público lê" OU "painel lê"),
-- e has_permission() rodava uma vez por linha. Com volume, a lista do painel ficava lenta: na
-- biblioteca de mídia, as três subconsultas da política pública também rodavam linha a linha.
--
-- Agora:
--   • "público lê …" vale só para anon (mesma condição de antes);
--   • "painel lê" vale para authenticated: (select has_permission(...)) OU a condição pública.
-- O (select …) faz o Postgres avaliar a permissão uma vez por consulta (InitPlan). Resultado
-- para cada papel: o mesmo conjunto de linhas de antes.

alter policy "areas: público lê publicados" on public.areas to anon;
alter policy "areas: painel lê" on public.areas
  using ((select public.has_permission('area', 'view')) or (status = 'published' and published_at <= now()));

alter policy "services: público lê publicados" on public.services to anon;
alter policy "services: painel lê" on public.services
  using ((select public.has_permission('service', 'view')) or (status = 'published' and published_at <= now()));

alter policy "service_areas: público lê vínculos publicados" on public.service_areas to anon;
alter policy "service_areas: painel lê" on public.service_areas
  using ((select public.has_permission('service', 'view'))
         or (exists (select 1 from public.services s
                     where s.id = service_id and s.status = 'published' and s.published_at <= now())
             and exists (select 1 from public.areas a
                         where a.id = area_id and a.status = 'published' and a.published_at <= now())));

alter policy "case_categories: público lê publicados" on public.case_categories to anon;
alter policy "case_categories: painel lê" on public.case_categories
  using ((select public.has_permission('category', 'view')) or (status = 'published' and published_at <= now()));

alter policy "cases: público lê publicados" on public.cases to anon;
alter policy "cases: painel lê" on public.cases
  using ((select public.has_permission('case', 'view')) or (status = 'published' and published_at <= now()));

alter policy "case_services: público lê vínculos publicados" on public.case_services to anon;
alter policy "case_services: painel lê" on public.case_services
  using ((select public.has_permission('case', 'view'))
         or (exists (select 1 from public.cases c
                     where c.id = case_id and c.status = 'published' and c.published_at <= now())
             and exists (select 1 from public.services s
                         where s.id = service_id and s.status = 'published' and s.published_at <= now())));

alter policy "case_media: público lê galeria publicada" on public.case_media to anon;
alter policy "case_media: painel lê" on public.case_media
  using ((select public.has_permission('case', 'view'))
         or exists (select 1 from public.cases c
                    where c.id = case_id and c.status = 'published' and c.published_at <= now()));

alter policy "media_assets: público lê mídia publicada" on public.media_assets to anon;
alter policy "media_assets: painel lê" on public.media_assets
  using ((select public.has_permission('media', 'view'))
         or exists (select 1 from public.cases c
                    where c.cover_media_id = media_assets.id and c.status = 'published' and c.published_at <= now())
         or exists (select 1 from public.case_media cm join public.cases c on c.id = cm.case_id
                    where cm.media_id = media_assets.id and c.status = 'published' and c.published_at <= now())
         or exists (select 1 from public.services s
                    where s.image_media_id = media_assets.id and s.status = 'published' and s.published_at <= now()));

alter policy "ctas: público lê publicados" on public.ctas to anon;
alter policy "ctas: painel lê" on public.ctas
  using ((select public.has_permission('cta', 'view')) or (status = 'published' and published_at <= now()));

alter policy "pages: público lê publicadas" on public.pages to anon;
alter policy "pages: painel lê" on public.pages
  using ((select public.has_permission('page', 'view')) or (status = 'published' and published_at <= now()));

alter policy "blocks: público lê blocos de páginas publicadas" on public.blocks to anon;
alter policy "blocks: painel lê" on public.blocks
  using ((select public.has_permission('page', 'view'))
         or exists (select 1 from public.pages p
                    where p.id = page_id and p.status = 'published' and p.published_at <= now()));
