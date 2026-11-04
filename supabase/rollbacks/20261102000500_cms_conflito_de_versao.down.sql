/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000500_cms_conflito_de_versao.down.sql
 Descrição    : Reversão do código de versão desatualizada em save_service e save_case (DBX-04).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (DBX-04).
 04/11/2026 Vinícius Nishimura Reis  O store também traduz 40001 como conflito (DBX-04).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261102000500_cms_conflito_de_versao.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261102000500
--
-- Não apaga dados, mas devolve o 40001, com o qual a chamada desatualizada fica sem resposta. O
-- store (toCmsError) traduz BJ002 e 40001 como conflito, então a aplicação não precisa ser revertida
-- junto. Pode rodar de novo sem erro.

begin;

create or replace function public.save_service(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb,
  p_area_ids uuid[]
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c_columns constant text[] := array['slug', 'name', 'summary', 'description', 'examples', 'icon',
    'image_media_id', 'featured', 'sort_order'];
  saved public.services%rowtype;
  x record;
  v_version timestamptz;
begin
  if jsonb_typeof(p_values) is distinct from 'object'
     or not p_values ?& c_columns
     or p_values - c_columns <> '{}'::jsonb
     or p_area_ids is null
     or (p_id is null) <> (p_expected_updated_at is null) then
    raise exception 'Parâmetros inválidos.' using errcode = '22023';
  end if;
  if not public.has_permission('service', case when p_id is null then 'create' else 'edit' end) then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;

  select * into x from jsonb_to_record(p_values) as r(
    slug text, name text, summary text, description text, examples text[], icon text,
    image_media_id uuid, featured boolean, sort_order integer
  );

  if p_id is null then
    insert into public.services (slug, name, summary, description, examples, icon, image_media_id,
      featured, sort_order, status)
    values (x.slug, x.name, x.summary, x.description, x.examples, x.icon, x.image_media_id,
      x.featured, x.sort_order, 'draft')
    returning * into saved;
  else
    update public.services s set slug = x.slug, name = x.name, summary = x.summary,
      description = x.description, examples = x.examples, icon = x.icon,
      image_media_id = x.image_media_id, featured = x.featured, sort_order = x.sort_order
    where s.id = p_id and s.updated_at = p_expected_updated_at
    returning * into saved;
    if not found then
      select s.updated_at into v_version from public.services s where s.id = p_id;
      if not found then
        raise exception 'Serviço não encontrado.' using errcode = 'P0002';
      elsif v_version = p_expected_updated_at then
        raise exception 'Operação não permitida.' using errcode = '42501';
      end if;
      raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
    end if;
  end if;

  delete from public.service_areas sa where sa.service_id = saved.id;
  insert into public.service_areas (service_id, area_id)
  select distinct saved.id, ids.area_id from unnest(p_area_ids) as ids(area_id);

  return query select saved.id, saved.updated_at;
end;
$$;

comment on function public.save_service(uuid, timestamptz, jsonb, uuid[]) is
  'Cria (p_id nulo) ou edita um serviço e substitui as áreas dele numa transação (TECH-13).';

create or replace function public.save_case(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb,
  p_service_ids uuid[],
  p_gallery_ids uuid[]
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c_columns constant text[] := array['slug', 'title', 'client_name', 'category_id', 'delivery_type',
    'summary', 'challenge', 'solution', 'results', 'cover_media_id', 'external_links',
    'reference_month', 'team', 'featured', 'sort_order'];
  saved public.cases%rowtype;
  x record;
  v_version timestamptz;
begin
  if jsonb_typeof(p_values) is distinct from 'object'
     or not p_values ?& c_columns
     or p_values - c_columns <> '{}'::jsonb
     or p_service_ids is null
     or p_gallery_ids is null
     or (p_id is null) <> (p_expected_updated_at is null) then
    raise exception 'Parâmetros inválidos.' using errcode = '22023';
  end if;
  if not public.has_permission('case', case when p_id is null then 'create' else 'edit' end) then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;

  select * into x from jsonb_to_record(p_values) as r(
    slug text, title text, client_name text, category_id uuid, delivery_type text, summary text,
    challenge text, solution text, results text, cover_media_id uuid, external_links jsonb,
    reference_month date, team text[], featured boolean, sort_order integer
  );

  if p_id is null then
    insert into public.cases (slug, title, client_name, category_id, delivery_type, summary,
      challenge, solution, results, cover_media_id, external_links, reference_month, team,
      featured, sort_order, status)
    values (x.slug, x.title, x.client_name, x.category_id, x.delivery_type, x.summary,
      x.challenge, x.solution, x.results, x.cover_media_id, x.external_links, x.reference_month,
      x.team, x.featured, x.sort_order, 'draft')
    returning * into saved;
  else
    update public.cases c set slug = x.slug, title = x.title, client_name = x.client_name,
      category_id = x.category_id, delivery_type = x.delivery_type, summary = x.summary,
      challenge = x.challenge, solution = x.solution, results = x.results,
      cover_media_id = x.cover_media_id, external_links = x.external_links,
      reference_month = x.reference_month, team = x.team, featured = x.featured,
      sort_order = x.sort_order
    where c.id = p_id and c.updated_at = p_expected_updated_at
    returning * into saved;
    if not found then
      select c.updated_at into v_version from public.cases c where c.id = p_id;
      if not found then
        raise exception 'Case não encontrado.' using errcode = 'P0002';
      elsif v_version = p_expected_updated_at then
        raise exception 'Operação não permitida.' using errcode = '42501';
      end if;
      raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
    end if;
  end if;

  delete from public.case_services cs where cs.case_id = saved.id;
  insert into public.case_services (case_id, service_id)
  select distinct saved.id, ids.service_id from unnest(p_service_ids) as ids(service_id);

  -- A ordem da galeria é a da lista; id repetido fica na primeira posição.
  delete from public.case_media cm where cm.case_id = saved.id;
  insert into public.case_media (case_id, media_id, sort_order)
  select saved.id, g.media_id, (row_number() over (order by min(g.ord)) - 1)::integer
  from unnest(p_gallery_ids) with ordinality as g(media_id, ord)
  group by g.media_id;

  return query select saved.id, saved.updated_at;
end;
$$;

comment on function public.save_case(uuid, timestamptz, jsonb, uuid[], uuid[]) is
  'Cria (p_id nulo) ou edita um case e substitui serviços e galeria numa transação (TECH-13).';

commit;
