/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261029000100_db08_slugs_e_urls.down.sql
 Descrição    : Reversão dos endereços antigos, endereços reservados e trava de slug publicado (DB-08).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 29/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 29/10/2026 Vinicius Binda             Criação inicial (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261029000100_db08_slugs_e_urls.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261029000100
--
-- Antes, volte a versão do site para uma sem DB-08: o proxy desta versão chama
-- resolve_public_slug. Sem a tabela, os endereços antigos passam a dar 404 e os reservados
-- ficam livres de novo. Se houver endereços registrados, a reversão é interrompida; para
-- descartá-los de propósito, rode antes, na mesma sessão: set benjamin.confirmar_rollback = 'sim';

begin;

do $$
declare
  v_has_rows boolean;
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if to_regclass('public.slug_redirects') is not null then
    select exists (select 1 from public.slug_redirects) into v_has_rows;
    if v_has_rows then
      raise exception 'public.slug_redirects tem endereços antigos. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';';
    end if;
  end if;
end;
$$;

drop function if exists public.resolve_public_slug(text, text);

drop trigger if exists areas_lock_slug on public.areas;
drop trigger if exists case_categories_lock_slug on public.case_categories;
drop trigger if exists pages_lock_slug on public.pages;
drop function if exists public.lock_published_slug();

drop trigger if exists services_track_slug on public.services;
drop trigger if exists cases_track_slug on public.cases;
drop function if exists public.track_slug();

drop table if exists public.slug_redirects;

commit;
