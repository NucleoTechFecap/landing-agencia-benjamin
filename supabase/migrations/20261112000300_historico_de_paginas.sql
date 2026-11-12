-- ════════════════════════════════════════════════════════════════════════════════
--  Sistema      : Agência Benjamin Landing Page
--  Módulo       : Supabase
--  Arquivo      : 20261112000300_historico_de_paginas.sql
--  Descrição    : Versões protegidas de páginas e seus blocos.
--  Desenvolvedor: Vinícius Nishimura Reis
--  Projeto      : Agência Benjamin Landing Page
--  Versão       : 1.0.0
--  Criado em    : 12/11/2026
--  Modificado em: 12/11/2026
--  Histórico    : 12/11/2026 Codex — Histórico de páginas (FUT-04).
-- ════════════════════════════════════════════════════════════════════════════════

create table public.page_versions (
  id bigint generated always as identity primary key,
  page_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  transaction_id bigint not null default txid_current(),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  unique (page_id, transaction_id)
);
create index page_versions_page_idx on public.page_versions (page_id, id desc);
alter table public.page_versions enable row level security;
revoke all on public.page_versions from public, anon, authenticated;
grant select on public.page_versions to authenticated;
create policy "page_versions: painel lê" on public.page_versions for select to authenticated
  using (public.has_permission('page', 'view'));

-- Cada transação consolida sua versão final por página; não há gravação direta pelo cliente.
create function public.capture_page_version(p_page_id uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.page_versions (page_id, actor_id, snapshot)
  select p.id, (select auth.uid()), jsonb_build_object(
    'page', to_jsonb(p),
    'blocks', coalesce((select jsonb_agg(jsonb_build_object('type', b.type, 'content', b.content,
                         'sort_order', b.sort_order) order by b.sort_order, b.id)
                        from public.blocks b where b.page_id = p.id), '[]'::jsonb)
  ) from public.pages p where p.id = p_page_id
  on conflict (page_id, transaction_id) do update
    set snapshot = excluded.snapshot, actor_id = excluded.actor_id, created_at = clock_timestamp();
$$;
revoke all on function public.capture_page_version(uuid) from public, anon, authenticated;

create function public.capture_page_version_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'pages' then
    perform public.capture_page_version(case when tg_op = 'DELETE' then old.id else new.id end);
  else
    if tg_op <> 'INSERT' then perform public.capture_page_version(old.page_id); end if;
    if tg_op <> 'DELETE' and (tg_op = 'INSERT' or new.page_id is distinct from old.page_id) then
      perform public.capture_page_version(new.page_id);
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.capture_page_version_trigger() from public, anon, authenticated;
create trigger pages_version_write after insert or update on public.pages
  for each row execute function public.capture_page_version_trigger();
create trigger pages_version_delete before delete on public.pages
  for each row execute function public.capture_page_version_trigger();
create trigger blocks_version_write after insert or update or delete on public.blocks
  for each row execute function public.capture_page_version_trigger();

-- Base inicial: preserva o conteúdo que já existia quando o histórico foi ativado.
select public.capture_page_version(id) from public.pages;

-- Restaura apenas dados e blocos. Uma página no ar volta a rascunho para nova revisão;
-- estado, data original de publicação, identificador e endereço não vêm do snapshot.
create function public.restore_page_version(p_page_id uuid, p_version_id bigint, p_expected_updated_at timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_page public.pages%rowtype;
  v_snapshot jsonb;
begin
  if (select auth.uid()) is null or not public.has_permission('page', 'edit') then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;
  select * into v_page from public.pages where id = p_page_id for update;
  if not found then raise exception 'Página não encontrada.' using errcode = 'P0002'; end if;
  if v_page.updated_at is distinct from p_expected_updated_at then
    raise exception 'Página alterada por outra pessoa.' using errcode = 'BJ002';
  end if;
  if v_page.status = 'archived' then raise exception 'Restaure do arquivo antes de editar.' using errcode = 'BJ001'; end if;
  if v_page.status = 'published' and not public.has_permission('page', 'publish') then
    raise exception 'Permissão de publicação necessária.' using errcode = '42501';
  end if;
  select snapshot into v_snapshot from public.page_versions where id = p_version_id and page_id = p_page_id;
  if not found then raise exception 'Versão não encontrada.' using errcode = 'P0002'; end if;
  if jsonb_typeof(v_snapshot->'blocks') is distinct from 'array'
     or jsonb_typeof(v_snapshot->'page') is distinct from 'object' then
    raise exception 'Versão inválida.' using errcode = '23514';
  end if;
  update public.pages set
    title = v_snapshot->'page'->>'title',
    description = v_snapshot->'page'->>'description',
    provisional = coalesce((v_snapshot->'page'->>'provisional')::boolean, false),
    status = case when v_page.status = 'published' then 'draft'::public.publish_status else v_page.status end
  where id = p_page_id;
  delete from public.blocks where page_id = p_page_id;
  insert into public.blocks (page_id, type, content, sort_order)
    select p_page_id, x.type, x.content, x.sort_order
    from jsonb_to_recordset(v_snapshot->'blocks') as x(type text, content jsonb, sort_order integer);
  perform public.record_audit_event('content.updated', 'content', p_page_id::text, 'success',
    jsonb_build_object('entity', 'page', 'reason', 'versao-restaurada', 'version', p_version_id));
end;
$$;
revoke all on function public.restore_page_version(uuid, bigint, timestamptz) from public, anon;
grant execute on function public.restore_page_version(uuid, bigint, timestamptz) to authenticated;
