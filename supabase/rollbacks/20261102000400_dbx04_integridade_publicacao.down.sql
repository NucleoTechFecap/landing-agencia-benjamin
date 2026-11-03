/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000400_dbx04_integridade_publicacao.down.sql
 Descrição    : Reversão das regras de transição e integridade de publicação (DBX-04).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (DBX-04).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261102000400_dbx04_integridade_publicacao.sql. O Supabase CLI não executa reversões:
-- aplicar manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261102000400
--
-- Não apaga dados: só remove as verificações, e as regras voltam a valer apenas na aplicação.
-- Pode rodar de novo sem erro.

begin;

drop trigger if exists media_assets_publication_integrity on public.media_assets;
drop trigger if exists case_media_publication_integrity on public.case_media;
drop trigger if exists case_services_publication_integrity on public.case_services;
drop trigger if exists case_categories_publication_integrity on public.case_categories;
drop trigger if exists cases_publication_integrity on public.cases;
drop trigger if exists service_areas_publication_integrity on public.service_areas;
drop trigger if exists services_publication_integrity on public.services;

drop trigger if exists pages_publication_state on public.pages;
drop trigger if exists ctas_publication_state on public.ctas;
drop trigger if exists cases_publication_state on public.cases;
drop trigger if exists case_categories_publication_state on public.case_categories;
drop trigger if exists services_publication_state on public.services;
drop trigger if exists areas_publication_state on public.areas;

drop function if exists public.enforce_publication_integrity();
drop function if exists public.assert_case_publishable(uuid);
drop function if exists public.assert_service_publishable(uuid);
drop function if exists public.assert_media_described(uuid[]);
drop function if exists public.enforce_publication_state();

alter table public.blocks drop constraint if exists blocks_type_catalog;

comment on table public.services is 'Serviços oferecidos. Pertencem a 1..N áreas (regra R03 validada na aplicação).';

commit;
