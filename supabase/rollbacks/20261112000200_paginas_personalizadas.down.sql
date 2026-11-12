-- ════════════════════════════════════════════════════════════════════════════════
--  Sistema      : Agência Benjamin Landing Page
--  Módulo       : Supabase
--  Arquivo      : 20261112000200_paginas_personalizadas.down.sql
--  Descrição    : Reversão protegida das páginas personalizadas.
--  Desenvolvedor: Vinícius Nishimura Reis
--  Projeto      : Agência Benjamin Landing Page
--  Versão       : 1.0.0
--  Criado em    : 12/11/2026
--  Modificado em: 12/11/2026
--  Histórico    : 12/11/2026 Codex — Reversão de páginas personalizadas.
-- ════════════════════════════════════════════════════════════════════════════════

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public'
             and table_name = 'pages' and column_name = 'is_custom') then
    if exists (select 1 from public.pages where is_custom) then
      raise exception 'Existem páginas personalizadas. Preserve o conteúdo e peça autorização antes de reverter.';
    end if;
  end if;
  if exists (select 1 from public.blocks where type = 'image') then
    raise exception 'Existem blocos de imagem. Preserve o conteúdo antes de reverter.';
  end if;
end $$;
drop trigger if exists media_page_image_guard on public.media_assets;
drop function if exists public.guard_page_image_asset();
drop trigger if exists blocks_image_guard on public.blocks;
drop function if exists public.guard_page_image_block();
alter table public.blocks drop constraint if exists blocks_type_catalog;
alter table public.blocks add constraint blocks_type_catalog
  check (type in ('rich-text', 'list', 'team', 'cta', 'manifesto', 'about'));
drop trigger if exists pages_custom_guard on public.pages;
drop function if exists public.guard_custom_page();
alter table public.pages drop constraint if exists pages_custom_slug_not_fixed;
alter table public.pages drop column if exists is_custom;
