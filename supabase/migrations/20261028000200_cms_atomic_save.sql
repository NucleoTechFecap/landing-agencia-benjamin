/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000200_cms_atomic_save.sql
 Descrição    : Salva conteúdo do CMS e seus vínculos numa transação sob RLS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinícius Nishimura Reis  Atomicidade para item, vínculos e galeria (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- As funções usam o contexto de RLS do chamador. `updated_at` é verificado dentro da
-- mesma transação da gravação; qualquer erro de coluna, vínculo ou FK desfaz tudo.

create function public.save_area(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.areas%rowtype;
  x record;
begin
  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'Valores inválidos.' using errcode = '22023';
  end if;
  select * into x from jsonb_to_record(p_values) as r(
    slug text, name text, summary text, description text, highlights text[], icon text, sort_order integer
  );

  if p_id is null then
    if p_expected_updated_at is not null or not public.has_permission('area', 'create') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    insert into public.areas (slug, name, summary, description, highlights, icon, sort_order, status)
    values (x.slug, x.name, x.summary, x.description, coalesce(x.highlights, '{}'), x.icon, x.sort_order, 'draft')
    returning * into v;
  else
    if p_expected_updated_at is null or not public.has_permission('area', 'edit') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    update public.areas set slug = x.slug, name = x.name, summary = x.summary, description = x.description,
      highlights = coalesce(x.highlights, '{}'), icon = x.icon, sort_order = x.sort_order
    where areas.id = p_id and areas.updated_at = p_expected_updated_at
    returning * into v;
    if not found then
      if exists (select 1 from public.areas where areas.id = p_id) then
        raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
      end if;
      raise exception 'Área não encontrada.' using errcode = 'P0002';
    end if;
  end if;
  return query select v.id, v.updated_at;
end;
$$;

create function public.save_category(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.case_categories%rowtype;
  x record;
begin
  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'Valores inválidos.' using errcode = '22023';
  end if;
  select * into x from jsonb_to_record(p_values) as r(slug text, name text, description text, sort_order integer);

  if p_id is null then
    if p_expected_updated_at is not null or not public.has_permission('category', 'create') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    insert into public.case_categories (slug, name, description, sort_order, status)
    values (x.slug, x.name, x.description, x.sort_order, 'draft')
    returning * into v;
  else
    if p_expected_updated_at is null or not public.has_permission('category', 'edit') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    update public.case_categories set slug = x.slug, name = x.name, description = x.description,
      sort_order = x.sort_order
    where case_categories.id = p_id and case_categories.updated_at = p_expected_updated_at
    returning * into v;
    if not found then
      if exists (select 1 from public.case_categories where case_categories.id = p_id) then
        raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
      end if;
      raise exception 'Categoria não encontrada.' using errcode = 'P0002';
    end if;
  end if;
  return query select v.id, v.updated_at;
end;
$$;

create function public.save_service(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb,
  p_area_ids uuid[] default '{}'
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.services%rowtype;
  x record;
begin
  if p_values is null or jsonb_typeof(p_values) <> 'object'
     or cardinality(coalesce(p_area_ids, '{}')) > 6 then
    raise exception 'Valores inválidos.' using errcode = '22023';
  end if;
  select * into x from jsonb_to_record(p_values) as r(
    slug text, name text, summary text, description text, examples text[], icon text,
    image_media_id uuid, featured boolean, sort_order integer
  );

  if p_id is null then
    if p_expected_updated_at is not null or not public.has_permission('service', 'create') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    insert into public.services (slug, name, summary, description, examples, icon, image_media_id,
      featured, sort_order, status)
    values (x.slug, x.name, x.summary, x.description, coalesce(x.examples, '{}'), x.icon,
      x.image_media_id, coalesce(x.featured, false), x.sort_order, 'draft')
    returning * into v;
  else
    if p_expected_updated_at is null or not public.has_permission('service', 'edit') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    update public.services set slug = x.slug, name = x.name, summary = x.summary, description = x.description,
      examples = coalesce(x.examples, '{}'), icon = x.icon, image_media_id = x.image_media_id,
      featured = coalesce(x.featured, false), sort_order = x.sort_order
    where services.id = p_id and services.updated_at = p_expected_updated_at
    returning * into v;
    if not found then
      if exists (select 1 from public.services where services.id = p_id) then
        raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
      end if;
      raise exception 'Serviço não encontrado.' using errcode = 'P0002';
    end if;
  end if;

  delete from public.service_areas where service_id = v.id;
  insert into public.service_areas (service_id, area_id)
  select v.id, ids.area_id
  from (select distinct unnest(coalesce(p_area_ids, '{}')) as area_id) ids;
  return query select v.id, v.updated_at;
end;
$$;

create function public.save_case(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb,
  p_service_ids uuid[] default '{}',
  p_gallery_ids uuid[] default '{}'
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.cases%rowtype;
  x record;
begin
  if p_values is null or jsonb_typeof(p_values) <> 'object'
     or cardinality(coalesce(p_service_ids, '{}')) > 9
     or cardinality(coalesce(p_gallery_ids, '{}')) > 20 then
    raise exception 'Valores inválidos.' using errcode = '22023';
  end if;
  select * into x from jsonb_to_record(p_values) as r(
    slug text, title text, client_name text, category_id uuid, delivery_type text, summary text,
    challenge text, solution text, results text, cover_media_id uuid, external_links jsonb,
    reference_month date, team text[], featured boolean, sort_order integer
  );

  if p_id is null then
    if p_expected_updated_at is not null or not public.has_permission('case', 'create') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    insert into public.cases (slug, title, client_name, category_id, delivery_type, summary, challenge, solution,
      results, cover_media_id, external_links, reference_month, team, featured, sort_order, status)
    values (x.slug, x.title, x.client_name, x.category_id, x.delivery_type, x.summary, x.challenge, x.solution,
      x.results, x.cover_media_id, coalesce(x.external_links, '[]'), x.reference_month, coalesce(x.team, '{}'),
      coalesce(x.featured, false), x.sort_order, 'draft')
    returning * into v;
  else
    if p_expected_updated_at is null or not public.has_permission('case', 'edit') then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    update public.cases set slug = x.slug, title = x.title, client_name = x.client_name,
      category_id = x.category_id, delivery_type = x.delivery_type, summary = x.summary,
      challenge = x.challenge, solution = x.solution, results = x.results, cover_media_id = x.cover_media_id,
      external_links = coalesce(x.external_links, '[]'), reference_month = x.reference_month,
      team = coalesce(x.team, '{}'), featured = coalesce(x.featured, false), sort_order = x.sort_order
    where cases.id = p_id and cases.updated_at = p_expected_updated_at
    returning * into v;
    if not found then
      if exists (select 1 from public.cases where cases.id = p_id) then
        raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
      end if;
      raise exception 'Case não encontrado.' using errcode = 'P0002';
    end if;
  end if;

  delete from public.case_services where case_id = v.id;
  insert into public.case_services (case_id, service_id)
  select v.id, ids.service_id
  from (select distinct unnest(coalesce(p_service_ids, '{}')) as service_id) ids;

  delete from public.case_media where case_id = v.id;
  insert into public.case_media (case_id, media_id, sort_order)
  select v.id, ordered.media_id, (row_number() over (order by ordered.first_position) - 1)::integer
  from (
    select media_id, min(position) as first_position
    from unnest(coalesce(p_gallery_ids, '{}')) with ordinality as gallery(media_id, position)
    group by media_id
  ) ordered;
  return query select v.id, v.updated_at;
end;
$$;

revoke all on function public.save_area(uuid, timestamptz, jsonb) from public;
revoke all on function public.save_category(uuid, timestamptz, jsonb) from public;
revoke all on function public.save_service(uuid, timestamptz, jsonb, uuid[]) from public;
revoke all on function public.save_case(uuid, timestamptz, jsonb, uuid[], uuid[]) from public;
revoke execute on function public.save_area(uuid, timestamptz, jsonb) from anon;
revoke execute on function public.save_category(uuid, timestamptz, jsonb) from anon;
revoke execute on function public.save_service(uuid, timestamptz, jsonb, uuid[]) from anon;
revoke execute on function public.save_case(uuid, timestamptz, jsonb, uuid[], uuid[]) from anon;
grant execute on function public.save_area(uuid, timestamptz, jsonb) to authenticated;
grant execute on function public.save_category(uuid, timestamptz, jsonb) to authenticated;
grant execute on function public.save_service(uuid, timestamptz, jsonb, uuid[]) to authenticated;
grant execute on function public.save_case(uuid, timestamptz, jsonb, uuid[], uuid[]) to authenticated;
