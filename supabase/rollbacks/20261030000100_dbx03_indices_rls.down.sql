/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000200_dbx03_indices_rls.down.sql
 Descrição    : Reversão dos índices de autoria e das políticas de leitura do painel (DBX-03).

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

-- Reverte 20261028000200_dbx03_indices_rls.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261028000200
--
-- Não apaga dados: só índices e a forma das políticas (as linhas visíveis a cada papel são as
-- mesmas antes e depois). Pode rodar de novo sem erro.

begin;

drop index if exists public.media_assets_updated_by_idx;
drop index if exists public.areas_updated_by_idx;
drop index if exists public.services_updated_by_idx;
drop index if exists public.case_categories_updated_by_idx;
drop index if exists public.cases_updated_by_idx;
drop index if exists public.ctas_updated_by_idx;
drop index if exists public.pages_updated_by_idx;
drop index if exists public.blocks_updated_by_idx;
drop index if exists public.site_settings_updated_by_idx;
drop index if exists public.profiles_invited_by_idx;
drop index if exists public.media_assets_created_idx;

-- Políticas como em 20261025000100_cms_content.sql: pública para anon e authenticated; painel
-- só com has_permission.
alter policy "areas: público lê publicados" on public.areas to anon, authenticated;
alter policy "areas: painel lê" on public.areas using (public.has_permission('area', 'view'));

alter policy "services: público lê publicados" on public.services to anon, authenticated;
alter policy "services: painel lê" on public.services using (public.has_permission('service', 'view'));

alter policy "service_areas: público lê vínculos publicados" on public.service_areas to anon, authenticated;
alter policy "service_areas: painel lê" on public.service_areas using (public.has_permission('service', 'view'));

alter policy "case_categories: público lê publicados" on public.case_categories to anon, authenticated;
alter policy "case_categories: painel lê" on public.case_categories using (public.has_permission('category', 'view'));

alter policy "cases: público lê publicados" on public.cases to anon, authenticated;
alter policy "cases: painel lê" on public.cases using (public.has_permission('case', 'view'));

alter policy "case_services: público lê vínculos publicados" on public.case_services to anon, authenticated;
alter policy "case_services: painel lê" on public.case_services using (public.has_permission('case', 'view'));

alter policy "case_media: público lê galeria publicada" on public.case_media to anon, authenticated;
alter policy "case_media: painel lê" on public.case_media using (public.has_permission('case', 'view'));

alter policy "media_assets: público lê mídia publicada" on public.media_assets to anon, authenticated;
alter policy "media_assets: painel lê" on public.media_assets using (public.has_permission('media', 'view'));

alter policy "ctas: público lê publicados" on public.ctas to anon, authenticated;
alter policy "ctas: painel lê" on public.ctas using (public.has_permission('cta', 'view'));

alter policy "pages: público lê publicadas" on public.pages to anon, authenticated;
alter policy "pages: painel lê" on public.pages using (public.has_permission('page', 'view'));

alter policy "blocks: público lê blocos de páginas publicadas" on public.blocks to anon, authenticated;
alter policy "blocks: painel lê" on public.blocks using (public.has_permission('page', 'view'));

commit;
