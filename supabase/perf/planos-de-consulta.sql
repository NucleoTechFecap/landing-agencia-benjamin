/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : planos-de-consulta.sql
 Descrição    : Volume sintético e EXPLAIN ANALYZE das consultas do site, do proxy e do painel (DBX-03).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-03).
──────────────────────────────────────────────────────────────────────────────
*/

-- Rodado por `npm run perf:queries` (scripts/explain-queries.mjs), só no banco local. Tudo fica
-- numa transação desfeita no fim: o volume sintético nunca permanece no banco.
--
-- :volume = 0 mede o banco vazio (só o seed, se houver); 1 cria o volume abaixo, bem acima do
-- que a agência deve publicar, para ver como cada consulta cresce:
--   50 áreas · 1.000 serviços (2 áreas cada) · 20 categorias · 10.000 cases (3 serviços e 5
--   imagens cada; 90% publicados, 5% rascunho, 5% arquivados) · 61.000 mídias · 500 CTAs ·
--   50 páginas com 20 blocos.
--
-- As consultas são as mesmas que o código faz (lib/server/content/supabase/queries.ts e
-- lib/server/cms/supabase-store.ts), com as mesmas colunas e filtros.

\set ON_ERROR_STOP 1
begin;

-- Conta de editor para as consultas do painel e para medir a exclusão de conta.
insert into auth.users (id, email, aud, role)
values ('00000000-0000-4000-8000-0000000000e1', 'editor-perf@teste.local', 'authenticated', 'authenticated');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000000e1';

select :volume = 1 as gerar_volume \gset
\if :gerar_volume
insert into public.media_assets (id, path, mime_type, alt_text, updated_by)
select md5('perf-media-' || i)::uuid, 'perf/' || i || '.webp', 'image/webp', 'Imagem ' || i,
       case when i % 100 = 0 then '00000000-0000-4000-8000-0000000000e1'::uuid end
from generate_series(1, 61000) i;

insert into public.areas (id, slug, name, summary, description, sort_order, status, published_at)
select md5('perf-area-' || i)::uuid, 'area-perf-' || i, 'Área ' || i, 'Resumo', 'Descrição', i, 'published', now() - interval '1 day'
from generate_series(1, 50) i;

insert into public.services (id, slug, name, summary, description, image_media_id, sort_order, status, published_at, updated_by)
select md5('perf-service-' || i)::uuid, 'servico-perf-' || i, 'Serviço ' || i, 'Resumo', 'Descrição',
       md5('perf-media-' || i)::uuid, i, 'published', now() - interval '1 day',
       case when i % 100 = 0 then '00000000-0000-4000-8000-0000000000e1'::uuid end
from generate_series(1, 1000) i;

insert into public.service_areas (service_id, area_id)
select md5('perf-service-' || i)::uuid, md5('perf-area-' || ((i + k) % 50 + 1))::uuid
from generate_series(1, 1000) i, generate_series(0, 1) k;

insert into public.case_categories (id, slug, name, sort_order, status, published_at)
select md5('perf-category-' || i)::uuid, 'categoria-perf-' || i, 'Categoria ' || i, i, 'published', now() - interval '1 day'
from generate_series(1, 20) i;

insert into public.cases (id, slug, title, client_name, category_id, summary, cover_media_id, sort_order,
                          status, published_at, archived_at, updated_by)
select md5('perf-case-' || i)::uuid, 'case-perf-' || i, 'Case ' || i, 'Cliente ' || (i % 300),
       md5('perf-category-' || (i % 20 + 1))::uuid, 'Resumo do case com pelo menos trinta caracteres.',
       md5('perf-media-' || (1000 + i))::uuid, i,
       case i % 20 when 0 then 'draft' when 1 then 'archived' else 'published' end::public.publish_status,
       case when i % 20 <> 0 then now() - interval '1 day' end,
       case when i % 20 = 1 then now() end,
       case when i % 100 = 0 then '00000000-0000-4000-8000-0000000000e1'::uuid end
from generate_series(1, 10000) i;

insert into public.case_services (case_id, service_id)
select md5('perf-case-' || i)::uuid, md5('perf-service-' || ((i * 7 + k * 13) % 1000 + 1))::uuid
from generate_series(1, 10000) i, generate_series(0, 2) k;

insert into public.case_media (case_id, media_id, sort_order)
select md5('perf-case-' || i)::uuid, md5('perf-media-' || (11000 + (i - 1) * 5 + k))::uuid, k
from generate_series(1, 10000) i, generate_series(1, 5) k;

insert into public.ctas (id, label, placement, target_kind, target_path, sort_order, status, published_at)
select md5('perf-cta-' || i)::uuid, 'CTA ' || i, 'footer', 'internal', '/servicos', i, 'published', now() - interval '1 day'
from generate_series(1, 500) i;

insert into public.pages (id, slug, title, status, published_at)
select md5('perf-page-' || i)::uuid, 'pagina-perf-' || i, 'Página ' || i, 'published', now() - interval '1 day'
from generate_series(1, 50) i;

insert into public.blocks (page_id, type, content, sort_order)
select md5('perf-page-' || i)::uuid, 'texto', '{}', k
from generate_series(1, 50) i, generate_series(1, 20) k;
\endif

analyze public.media_assets, public.areas, public.services, public.service_areas, public.case_categories,
  public.cases, public.case_services, public.case_media, public.ctas, public.pages, public.blocks;

-- Mede cada consulta com o papel indicado e guarda tempo, linhas, nós do plano e índices usados.
create temporary table planos (
  ordem serial,
  papel text,
  consulta text,
  linhas bigint,
  tempo_ms numeric,
  nos text,
  indices text
);

create function pg_temp.medir(p_papel text, p_consulta text, p_sql text)
returns void
language plpgsql
as $$
declare
  v_plano jsonb;
begin
  if p_papel = 'anon' then
    execute 'set local role anon';
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  elsif p_papel = 'editor' then
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      '{"role":"authenticated","sub":"00000000-0000-4000-8000-0000000000e1"}', true);
  else
    -- Operação de sistema (como o Auth ao excluir conta): sem sessão de usuário.
    perform set_config('request.jwt.claims', '', true);
  end if;
  execute 'explain (analyze, buffers, format json) ' || p_sql into v_plano;
  execute 'reset role';
  insert into planos (papel, consulta, linhas, tempo_ms, nos, indices)
  values (
    p_papel,
    p_consulta,
    (v_plano -> 0 -> 'Plan' ->> 'Actual Rows')::bigint,
    round((v_plano -> 0 ->> 'Execution Time')::numeric, 2),
    (select string_agg(distinct n #>> '{}', ', ') from jsonb_path_query(v_plano, '$.**."Node Type"') n),
    (select string_agg(distinct n #>> '{}', ', ') from jsonb_path_query(v_plano, '$.**."Index Name"') n)
  );
end;
$$;

\o /dev/null

-- ─── Site e API pública (cliente anônimo; cache do Next na frente) ─────────────

select pg_temp.medir('anon', 'areas publicadas',
  $q$select id, slug, name, summary, description, highlights, icon, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.areas where status = 'published'$q$);
select pg_temp.medir('anon', 'serviços publicados',
  $q$select id, slug, name, summary, description, examples, icon, image_media_id, featured, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.services where status = 'published'$q$);
select pg_temp.medir('anon', 'vínculos serviço × área',
  $q$select service_id, area_id from public.service_areas$q$);
select pg_temp.medir('anon', 'categorias publicadas',
  $q$select id, slug, name, description, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.case_categories where status = 'published'$q$);
select pg_temp.medir('anon', 'cases publicados',
  $q$select id, slug, title, client_name, category_id, delivery_type, summary, challenge, solution, results, cover_media_id, external_links, reference_month, team, featured, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.cases where status = 'published'$q$);
select pg_temp.medir('anon', 'vínculos case × serviço',
  $q$select case_id, service_id from public.case_services$q$);
select pg_temp.medir('anon', 'galerias (ordenadas)',
  $q$select case_id, media_id, sort_order from public.case_media order by sort_order$q$);
select pg_temp.medir('anon', 'mídia por id (capas, 1 lote)',
  $q$select id, path, mime_type, width, height, alt_text, decorative from public.media_assets
     where id in (select cover_media_id from public.cases where cover_media_id is not null limit 200)$q$);
select pg_temp.medir('anon', 'CTAs publicados',
  $q$select id, label, placement, target_kind, target_path, target_url, target_service_id, target_case_id, target_area_id, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.ctas where status = 'published'$q$);
select pg_temp.medir('anon', 'proxy: slug de case existe',
  $q$select slug from public.cases where slug = 'case-perf-5003' and status = 'published' limit 1$q$);
select pg_temp.medir('anon', 'página por slug',
  $q$select id, slug, title, description, status, provisional, published_at, archived_at, updated_at
     from public.pages where slug = 'pagina-perf-25' and status = 'published' limit 1$q$);
select pg_temp.medir('anon', 'blocos da página',
  $q$select id, page_id, type, content, sort_order from public.blocks
     where page_id = md5('perf-page-25')::uuid order by sort_order$q$);

-- ─── Painel (editor logado; RLS com has_permission) ────────────────────────────

select pg_temp.medir('editor', 'painel: cases',
  $q$select id, slug, title, client_name, category_id, delivery_type, summary, challenge, solution, results, cover_media_id, external_links, reference_month, team, featured, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.cases$q$);
select pg_temp.medir('editor', 'painel: serviços',
  $q$select id, slug, name, summary, description, examples, icon, image_media_id, featured, sort_order, status, provisional, published_at, archived_at, updated_at
     from public.services$q$);
select pg_temp.medir('editor', 'painel: vínculos case × serviço',
  $q$select case_id, service_id from public.case_services$q$);
select pg_temp.medir('editor', 'painel: galerias',
  $q$select case_id, media_id, sort_order from public.case_media$q$);
select pg_temp.medir('editor', 'painel: biblioteca de mídia',
  $q$select id, path, mime_type, width, height, alt_text, decorative from public.media_assets
     order by created_at desc$q$);

-- ─── Exclusão de conta (FKs updated_by com on delete set null) ─────────────────

select pg_temp.medir('postgres', 'excluir conta do editor',
  $q$delete from auth.users where id = '00000000-0000-4000-8000-0000000000e1'$q$);

\o
\pset footer off
select papel, consulta, linhas, tempo_ms, nos, coalesce(indices, '—') as indices from planos order by ordem;

rollback;
