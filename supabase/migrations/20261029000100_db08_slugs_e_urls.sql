/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261029000100_db08_slugs_e_urls.sql
 Descrição    : Endereços antigos de serviços e cases (301), endereços reservados e trava de slug publicado.

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

-- Slugs e URLs (DB-08). Regras completas em docs/banco/dicionario-de-dados.md §10.
--
-- Serviço e case têm página própria (/servicos/<slug>, /cases/<slug>). Depois da primeira
-- publicação o endereço pode mudar: o antigo fica registrado e o site responde 301 para o
-- atual. O endereço de item já publicado nunca passa a abrir outro conteúdo: continua com o
-- item (redirecionando) ou, se ele for excluído, fica reservado e responde 404.
-- Área, categoria e página não têm página própria: o slug fica fixo depois de publicado.

-- ─── 1. Endereços antigos ────────────────────────────────────────────────────

-- Aponta para o id, não para o slug novo: trocas seguidas (a → b → c) levam direto ao atual,
-- sem cadeia de redirecionamentos. Sem FK porque a tabela atende dois tipos; a limpeza é do
-- trigger abaixo. entity_id nulo = item excluído: o endereço fica reservado.
create table public.slug_redirects (
  entity_type text not null check (entity_type in ('service', 'case')),
  old_slug text not null check (public.is_valid_slug(old_slug)),
  entity_id uuid,
  created_at timestamptz not null default now(),
  primary key (entity_type, old_slug)
);

create index slug_redirects_entity_idx on public.slug_redirects (entity_id) where entity_id is not null;

comment on table public.slug_redirects is 'Slugs antigos de serviços e cases já publicados (301 para o atual). entity_id nulo: item excluído, endereço reservado. Gravada só pelo trigger track_slug.';

-- ─── 2. Trigger de serviços e cases ──────────────────────────────────────────

-- tg_argv[0] = entity_type. Roda antes da gravação, na mesma transação: se a gravação falhar,
-- o registro do endereço também é desfeito. security definer porque ninguém grava na tabela
-- diretamente (nem o painel).
create function public.track_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    -- Item que já foi ao ar: os endereços dele (atual e antigos) ficam reservados.
    if old.published_at is not null then
      update public.slug_redirects set entity_id = null
      where entity_type = tg_argv[0] and entity_id = old.id;
      insert into public.slug_redirects (entity_type, old_slug, entity_id)
      values (tg_argv[0], old.slug, null)
      on conflict (entity_type, old_slug) do update set entity_id = null;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and new.slug = old.slug then
    return new;
  end if;

  -- Endereço antigo de outro item (ou reservado) não pode ser reaproveitado: os links que
  -- circulam com ele abririam outro conteúdo. O próprio item pode voltar a um endereço seu.
  if exists (select 1 from public.slug_redirects r
             where r.entity_type = tg_argv[0] and r.old_slug = new.slug
               and r.entity_id is distinct from new.id) then
    raise exception 'O endereço "%" já foi usado por outro item e continua reservado.', new.slug
      using errcode = '23505', constraint = 'slug_redirects_pkey';
  end if;
  delete from public.slug_redirects where entity_type = tg_argv[0] and old_slug = new.slug;

  -- Rascunho que nunca foi ao ar troca de endereço livremente (ninguém tem o link).
  if tg_op = 'UPDATE' and old.published_at is not null then
    insert into public.slug_redirects (entity_type, old_slug, entity_id)
    values (tg_argv[0], old.slug, old.id)
    on conflict (entity_type, old_slug) do update set entity_id = excluded.entity_id, created_at = now();
  end if;
  return new;
end;
$$;

revoke execute on function public.track_slug() from public, anon, authenticated;

create trigger services_track_slug before insert or update of slug or delete on public.services
  for each row execute function public.track_slug('service');
create trigger cases_track_slug before insert or update of slug or delete on public.cases
  for each row execute function public.track_slug('case');

-- ─── 3. Slug fixo de área, categoria e página ───────────────────────────────

-- A aplicação já recusa (content-service.ts); o banco garante o mesmo para gravações fora do
-- painel (SQL Editor, service_role). A área é âncora de /areas, a categoria é filtro de
-- /cases e a página é a chave de uma rota fixa: não há página própria para redirecionar.
create function public.lock_published_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.published_at is not null and new.slug <> old.slug then
    raise exception 'O endereço não muda depois da primeira publicação.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger areas_lock_slug before update of slug on public.areas
  for each row execute function public.lock_published_slug();
create trigger case_categories_lock_slug before update of slug on public.case_categories
  for each row execute function public.lock_published_slug();
create trigger pages_lock_slug before update of slug on public.pages
  for each row execute function public.lock_published_slug();

-- ─── 4. Leitura ──────────────────────────────────────────────────────────────

revoke all on table public.slug_redirects from anon, authenticated;
grant select on table public.slug_redirects to anon, authenticated;
alter table public.slug_redirects enable row level security;

-- Visitante: só endereços antigos de item no ar (os de rascunho, arquivado e excluído não
-- aparecem). Painel: todos os do tipo que o papel pode ver, para avisar antes de salvar.
create policy "slug_redirects: público lê endereços de itens publicados" on public.slug_redirects
  for select to anon
  using ((entity_type = 'service'
          and exists (select 1 from public.services s
                      where s.id = entity_id and s.status = 'published' and s.published_at <= now()))
         or (entity_type = 'case'
             and exists (select 1 from public.cases c
                         where c.id = entity_id and c.status = 'published' and c.published_at <= now())));
create policy "slug_redirects: painel lê" on public.slug_redirects
  for select to authenticated
  using ((entity_type = 'service' and (select public.has_permission('service', 'view')))
         or (entity_type = 'case' and (select public.has_permission('case', 'view')))
         or (entity_type = 'service'
             and exists (select 1 from public.services s
                         where s.id = entity_id and s.status = 'published' and s.published_at <= now()))
         or (entity_type = 'case'
             and exists (select 1 from public.cases c
                         where c.id = entity_id and c.status = 'published' and c.published_at <= now())));

-- Endereço pedido na URL → slug atual do item publicado. Igual ao pedido: 200; diferente: 301
-- para o atual; null: 404 (inexistente, rascunho, arquivado, agendado ou excluído). Usada pelo
-- proxy.ts e pela API. Roda com a RLS de quem chama (security invoker).
create function public.resolve_public_slug(p_entity text, p_slug text)
returns text
language sql
stable
set search_path = ''
as $$
  select s.slug from public.services s
  where p_entity = 'service' and s.status = 'published' and s.published_at <= now()
    and s.id = coalesce((select x.id from public.services x where x.slug = p_slug),
                        (select r.entity_id from public.slug_redirects r
                         where r.entity_type = 'service' and r.old_slug = p_slug))
  union all
  select c.slug from public.cases c
  where p_entity = 'case' and c.status = 'published' and c.published_at <= now()
    and c.id = coalesce((select x.id from public.cases x where x.slug = p_slug),
                        (select r.entity_id from public.slug_redirects r
                         where r.entity_type = 'case' and r.old_slug = p_slug))
  limit 1;
$$;
