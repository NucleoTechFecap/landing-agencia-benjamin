/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261025000100_cms_content.down.sql
 Descrição    : Reversão da migration de conteúdo do CMS (tabelas, funções e enum de publicação).

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
 25/10/2026 Vinícius Binda             Criação inicial (DB-02).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261025000100_cms_content.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql), em ordem inversa das migrations e só depois de backup
-- (GO-01). Em seguida, registrar no histórico:
--   npx supabase migration repair --status reverted 20261025000100
--
-- Mantém as migrations 0100–0400 (perfis, RBAC, auditoria e formulários). Se houver conteúdo
-- cadastrado, a reversão é interrompida; para descartá-lo de propósito, rode antes, na mesma
-- sessão: set benjamin.confirmar_rollback = 'sim';

begin;

do $$
declare
  v_table text;
  v_has_rows boolean;
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  foreach v_table in array array['media_assets', 'areas', 'services', 'case_categories', 'cases', 'ctas', 'pages', 'blocks', 'site_settings'] loop
    if to_regclass('public.' || v_table) is not null then
      execute format('select exists (select 1 from public.%I)', v_table) into v_has_rows;
      if v_has_rows then
        raise exception 'public.% tem conteúdo. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';', v_table;
      end if;
    end if;
  end loop;
end;
$$;

drop table if exists
  public.blocks, public.pages, public.ctas, public.case_media, public.case_services, public.cases,
  public.case_categories, public.service_areas, public.services, public.areas, public.media_assets,
  public.site_settings;

drop function if exists public.stamp_updated_by();
drop function if exists public.is_valid_slug(text);
drop type if exists public.publish_status;

commit;
