-- ════════════════════════════════════════════════════════════════════════════════
--  Sistema      : Agência Benjamin Landing Page
--  Módulo       : Supabase
--  Arquivo      : 20261112000300_historico_de_paginas.down.sql
--  Descrição    : Reversão protegida do histórico de páginas.
--  Desenvolvedor: Vinícius Nishimura Reis
--  Projeto      : Agência Benjamin Landing Page
--  Versão       : 1.0.0
--  Criado em    : 12/11/2026
--  Modificado em: 12/11/2026
--  Histórico    : 12/11/2026 Codex — Reversão do histórico de páginas.
-- ════════════════════════════════════════════════════════════════════════════════

do $$ begin
  if to_regclass('public.page_versions') is not null then
    if current_setting('benjamin.confirmar_rollback', true) is distinct from 'sim'
       and exists (select 1 from public.page_versions) then
      raise exception 'O histórico contém versões. Preserve os dados e peça autorização antes de reverter.';
    end if;
  end if;
end $$;
drop function if exists public.restore_page_version(uuid, bigint, timestamptz);
drop trigger if exists blocks_version_write on public.blocks;
drop trigger if exists pages_version_delete on public.pages;
drop trigger if exists pages_version_write on public.pages;
drop function if exists public.capture_page_version_trigger();
drop function if exists public.capture_page_version(uuid);
drop table if exists public.page_versions;
