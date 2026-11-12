-- ════════════════════════════════════════════════════════════════════════════════
--  Sistema      : Agência Benjamin Landing Page
--  Módulo       : Supabase
--  Arquivo      : 20261112000200_paginas_personalizadas.sql
--  Descrição    : Identifica páginas próprias sem publicar páginas antigas inadvertidamente.
--  Desenvolvedor: Vinícius Nishimura Reis
--  Projeto      : Agência Benjamin Landing Page
--  Versão       : 1.0.0
--  Criado em    : 12/11/2026
--  Modificado em: 12/11/2026
--  Histórico    : 12/11/2026 Codex — Páginas personalizadas.
-- ════════════════════════════════════════════════════════════════════════════════

-- Páginas anteriores ficam false: uma página antiga sem rota não se torna pública por acidente.
alter table public.pages add column is_custom boolean not null default false;
alter table public.pages add constraint pages_custom_slug_not_fixed
  check (not is_custom or slug <> all (array['home','sobre','areas','servicos','cases','contato','privacidade']));

alter table public.blocks drop constraint blocks_type_catalog;
alter table public.blocks add constraint blocks_type_catalog
  check (type in ('rich-text', 'list', 'team', 'cta', 'manifesto', 'about', 'image'));

-- Referências em JSON também são protegidas no banco, inclusive em chamadas diretas à API.
create function public.guard_page_image_block() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_asset public.media_assets%rowtype;
begin
  if new.type <> 'image' then return new; end if;
  select * into v_asset from public.media_assets m
    where m.id::text = new.content #>> '{image,id}' for key share;
  if not found or v_asset.mime_type not like 'image/%' or v_asset.decorative
     or coalesce(btrim(v_asset.alt_text), '') = ''
     or new.content #>> '{image,alt}' is distinct from btrim(v_asset.alt_text)
     or (case when v_asset.path like '/%' then new.content #>> '{image,src}' is distinct from v_asset.path
              else right(coalesce(new.content #>> '{image,src}', ''), length(v_asset.path) + 1) <> '/' || v_asset.path end) then
    raise exception 'Imagem de bloco precisa referenciar mídia válida com texto alternativo.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_page_image_block() from public, anon, authenticated;
create trigger blocks_image_guard before insert or update on public.blocks
  for each row execute function public.guard_page_image_block();

create function public.guard_page_image_asset() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.blocks b where b.type = 'image' and b.content #>> '{image,id}' = old.id::text) then
    if tg_op = 'DELETE' then
      raise exception 'Imagem usada por página não pode ser excluída.' using errcode = '23503';
    end if;
    if new.mime_type not like 'image/%' or new.decorative or coalesce(btrim(new.alt_text), '') = '' then
      raise exception 'Imagem usada por página precisa de texto alternativo.' using errcode = 'BJ003';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_page_image_asset() from public, anon, authenticated;
create trigger media_page_image_guard before update or delete on public.media_assets
  for each row execute function public.guard_page_image_asset();

create function public.guard_custom_page() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.is_custom is distinct from old.is_custom then
    raise exception 'O tipo da página não pode ser alterado.' using errcode = 'BJ001';
  end if;
  if tg_op = 'DELETE' and old.is_custom and old.published_at is not null then
    raise exception 'Páginas publicadas devem permanecer arquivadas para preservar o endereço.' using errcode = 'BJ001';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_custom_page() from public, anon, authenticated;
create trigger pages_custom_guard before update or delete on public.pages
  for each row execute function public.guard_custom_page();
