/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : indices_rls.test.sql
 Descrição    : pgTAP da DBX-03: FKs indexadas, uma política de leitura por papel e mesmas linhas visíveis de antes.

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

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim. Usa o seed (case em rascunho, serviço arquivado,
-- mídia sem uso) mais os itens abaixo, para que cada papel enxergue um conjunto diferente.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

-- ─── Estrutura ────────────────────────────────────────────────────────────────

select is(
  (select count(*) from pg_constraint c
   where c.contype = 'f'
     and c.connamespace = 'public'::regnamespace
     and not exists (select 1 from pg_index i
                     where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])),
  0::bigint,
  'toda FK do schema public tem índice começando pela coluna da FK'
);

select has_index('public', 'media_assets', 'media_assets_created_idx', 'biblioteca de mídia ordenada por índice');

-- Tabelas do CMS: exatamente uma política de leitura para anon e uma para authenticated.
create temporary table tabelas_cms (nome text) on commit drop;
insert into tabelas_cms values ('areas'), ('services'), ('service_areas'), ('case_categories'), ('cases'),
  ('case_services'), ('case_media'), ('media_assets'), ('ctas'), ('pages'), ('blocks');

select is_empty(
  $$select t.nome from tabelas_cms t
    where (select count(*) from pg_policies p
           where p.schemaname = 'public' and p.tablename = t.nome
             and p.cmd in ('SELECT', 'ALL') and p.permissive = 'PERMISSIVE'
             and ('anon' = any (p.roles) or 'public' = any (p.roles))) <> 1
       or (select count(*) from pg_policies p
           where p.schemaname = 'public' and p.tablename = t.nome
             and p.cmd in ('SELECT', 'ALL') and p.permissive = 'PERMISSIVE'
             and ('authenticated' = any (p.roles) or 'public' = any (p.roles))) <> 1$$,
  'cada tabela do CMS tem uma política de leitura por papel'
);

select is_empty(
  $$select p.tablename from pg_policies p join tabelas_cms t on t.nome = p.tablename
    where p.schemaname = 'public' and p.policyname like '%: painel lê'
      and p.qual not like '%( SELECT has_permission(%'$$,
  'has_permission das políticas do painel é avaliado uma vez por consulta'
);

-- ─── Mesmas linhas visíveis que as políticas antigas ─────────────────────────

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000003a1', 'admin-dbx03@teste.invalid'),
  ('00000000-0000-4000-8000-0000000003e1', 'editor-dbx03@teste.invalid'),
  ('00000000-0000-4000-8000-0000000003f1', 'viewer-dbx03@teste.invalid'),
  ('00000000-0000-4000-8000-0000000003b1', 'pending-dbx03@teste.invalid');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000003a1';
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000003e1';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000003f1';

insert into public.areas (slug, name, summary, description, status, published_at) values
  ('area-dbx03-agendada', 'Agendada', 'Resumo', 'Descrição', 'published', now() + interval '7 days');
insert into public.case_categories (slug, name, status) values ('categoria-dbx03-rascunho', 'Rascunho', 'draft');
insert into public.ctas (label, placement, target_kind, target_path, status) values ('Rascunho', 'footer', 'internal', '/sobre', 'draft');
insert into public.pages (id, slug, title, status, published_at) values
  ('00000000-0000-4000-8000-000000000301', 'pagina-dbx03-no-ar', 'No ar', 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000302', 'pagina-dbx03-rascunho', 'Rascunho', 'draft', null);
insert into public.blocks (page_id, type) values
  ('00000000-0000-4000-8000-000000000301', 'texto'),
  ('00000000-0000-4000-8000-000000000302', 'texto');
insert into public.case_media (case_id, media_id, sort_order)
select (select id from public.cases where status = 'draft' limit 1), m.id, 0
from public.media_assets m where m.path like '/brand/logos/%' limit 1;

create temporary table visto (fase text, papel text, tabela text, linhas bigint) on commit drop;
grant select, insert on visto to anon, authenticated;
grant select on tabelas_cms to anon, authenticated;

create function pg_temp.contar(p_fase text)
returns void
language plpgsql
as $$
declare
  v_papel record;
  v_tabela text;
  v_linhas bigint;
begin
  for v_papel in
    select * from (values ('anon', null::uuid),
                          ('pending', '00000000-0000-4000-8000-0000000003b1'::uuid),
                          ('viewer', '00000000-0000-4000-8000-0000000003f1'::uuid),
                          ('editor', '00000000-0000-4000-8000-0000000003e1'::uuid),
                          ('admin', '00000000-0000-4000-8000-0000000003a1'::uuid)) r (nome, id)
  loop
    if v_papel.id is null then
      execute 'set local role anon';
      perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    else
      execute 'set local role authenticated';
      perform set_config('request.jwt.claims',
        json_build_object('role', 'authenticated', 'sub', v_papel.id)::text, true);
    end if;
    for v_tabela in select nome from tabelas_cms loop
      execute format('select count(*) from public.%I', v_tabela) into v_linhas;
      insert into visto values (p_fase, v_papel.nome, v_tabela, v_linhas);
    end loop;
    execute 'reset role';
  end loop;
end;
$$;

select pg_temp.contar('nova');

-- Políticas como estavam em 20261025000100_cms_content.sql (pública para anon e authenticated;
-- painel só com has_permission), aplicadas só dentro desta transação.
alter policy "areas: público lê publicados" on public.areas to anon, authenticated;
alter policy "areas: painel lê" on public.areas using (public.has_permission('area', 'view'));
alter policy "services: público lê publicados" on public.services to anon, authenticated;
alter policy "services: painel lê" on public.services using (public.has_permission('service', 'view'));
alter policy "service_areas: público lê vínculos publicados" on public.service_areas to anon, authenticated;
alter policy "service_areas: painel lê" on public.service_areas using (public.has_permission('service', 'view'));
alter policy "case_categories: público lê publicados" on public.case_categories to anon, authenticated;
alter policy "case_categories: painel lê" on public.case_categories using (public.has_permission('category', 'view'));
alter policy "cases: público lê publicados" on public.cases to anon, authenticated;
alter policy "cases: painel lê" on public.cases using (public.has_permission('case', 'view'));
alter policy "case_services: público lê vínculos publicados" on public.case_services to anon, authenticated;
alter policy "case_services: painel lê" on public.case_services using (public.has_permission('case', 'view'));
alter policy "case_media: público lê galeria publicada" on public.case_media to anon, authenticated;
alter policy "case_media: painel lê" on public.case_media using (public.has_permission('case', 'view'));
alter policy "media_assets: público lê mídia publicada" on public.media_assets to anon, authenticated;
alter policy "media_assets: painel lê" on public.media_assets using (public.has_permission('media', 'view'));
alter policy "ctas: público lê publicados" on public.ctas to anon, authenticated;
alter policy "ctas: painel lê" on public.ctas using (public.has_permission('cta', 'view'));
alter policy "pages: público lê publicadas" on public.pages to anon, authenticated;
alter policy "pages: painel lê" on public.pages using (public.has_permission('page', 'view'));
alter policy "blocks: público lê blocos de páginas publicadas" on public.blocks to anon, authenticated;
alter policy "blocks: painel lê" on public.blocks using (public.has_permission('page', 'view'));

select pg_temp.contar('antiga');

select is_empty(
  $$select n.papel, n.tabela, n.linhas as nova, a.linhas as antiga
    from visto n join visto a on a.papel = n.papel and a.tabela = n.tabela and a.fase = 'antiga'
    where n.fase = 'nova' and n.linhas <> a.linhas$$,
  'cada papel vê as mesmas linhas, em cada tabela, com as políticas novas e as antigas'
);

-- O teste só vale se os papéis enxergarem conjuntos diferentes (rascunhos existem).
select ok(
  (select bool_and(v.linhas < e.linhas)
   from visto v join visto e on e.tabela = v.tabela and e.fase = 'nova' and e.papel = 'editor'
   where v.fase = 'nova' and v.papel = 'anon'
     and v.tabela in ('areas', 'services', 'cases', 'case_categories', 'ctas', 'pages', 'blocks', 'media_assets')),
  'visitante vê menos que o editor nas tabelas com rascunho (dados de teste exercitam a RLS)'
);

select * from finish();
rollback;
