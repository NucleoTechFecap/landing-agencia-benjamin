/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : integridade_publicacao.test.sql
 Descrição    : pgTAP da DBX-04: transições, data de publicação, dependências de publicado e catálogo de blocos.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (DBX-04).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim, então o commit nunca chega: pg_temp.check força as
-- verificações adiadas ao fim de cada comando e volta a adiá-las. O caminho real, com commit, a
-- corrida e o papel service_role estão em tests/integration/supabase/integridade-publicacao.test.ts.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(48);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000401', 'editor-dbx04@teste.invalid'),
  ('00000000-0000-4000-8000-000000000402', 'admin-dbx04@teste.invalid');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-000000000401';
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000402';

-- a01 com alt, a02 com alt, a03 decorativa, a04 sem alt, a05 PDF.
insert into public.media_assets (id, path, mime_type, alt_text, decorative) values
  ('00000000-0000-4000-8000-000000000a01', 'dbx04/1.webp', 'image/webp', 'Um', false),
  ('00000000-0000-4000-8000-000000000a02', 'dbx04/2.webp', 'image/webp', 'Dois', false),
  ('00000000-0000-4000-8000-000000000a03', 'dbx04/3.webp', 'image/webp', null, true),
  ('00000000-0000-4000-8000-000000000a04', 'dbx04/4.webp', 'image/webp', null, false),
  ('00000000-0000-4000-8000-000000000a05', 'dbx04/5.pdf', 'application/pdf', null, false);
insert into public.areas (id, slug, name, summary, description, status, published_at) values
  ('00000000-0000-4000-8000-000000000b01', 'area-dbx04-1', 'Área 1', 's', 'd', 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000b02', 'area-dbx04-2', 'Área 2', 's', 'd', 'draft', null);
update public.areas set status = 'draft' where id = '00000000-0000-4000-8000-000000000b02';
insert into public.case_categories (id, slug, name, status, published_at) values
  ('00000000-0000-4000-8000-000000000c01', 'categoria-dbx04-1', 'Categoria 1', 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000c02', 'categoria-dbx04-2', 'Categoria 2', 'draft', null);
-- d01 e d02 publicados; d03 rascunho sem área; d04 arquivado.
insert into public.services (id, slug, name, summary, description, image_media_id, status, published_at, archived_at) values
  ('00000000-0000-4000-8000-000000000d01', 'servico-dbx04-1', 'Serviço 1', 's', 'd', '00000000-0000-4000-8000-000000000a01', 'published', now() - interval '1 day', null),
  ('00000000-0000-4000-8000-000000000d02', 'servico-dbx04-2', 'Serviço 2', 's', 'd', null, 'published', now() - interval '1 day', null),
  ('00000000-0000-4000-8000-000000000d03', 'servico-dbx04-3', 'Serviço 3', 's', 'd', null, 'draft', null, null),
  ('00000000-0000-4000-8000-000000000d04', 'servico-dbx04-4', 'Serviço 4', 's', 'd', null, 'archived', now() - interval '2 days', now() - interval '1 day');
insert into public.service_areas (service_id, area_id) values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-000000000b01'),
  ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-000000000b01');
-- e01 publicado com d01 e galeria; e02 rascunho completo, sem serviço publicado.
insert into public.cases (id, slug, title, client_name, category_id, summary, cover_media_id, status, published_at) values
  ('00000000-0000-4000-8000-000000000e01', 'case-dbx04-1', 'Case 1', 'Cliente fictício', '00000000-0000-4000-8000-000000000c01',
   'Resumo com tamanho suficiente para publicar.', '00000000-0000-4000-8000-000000000a01', 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000e02', 'case-dbx04-2', 'Case 2', 'Cliente fictício', '00000000-0000-4000-8000-000000000c01',
   'Resumo com tamanho suficiente para publicar.', '00000000-0000-4000-8000-000000000a01', 'draft', null);
insert into public.case_services (case_id, service_id) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000d01');
insert into public.case_media (case_id, media_id, sort_order) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000a02', 0);
insert into public.ctas (id, label, placement, target_kind, target_service_id, status, published_at, archived_at) values
  ('00000000-0000-4000-8000-000000000f01', 'CTA arquivado', 'footer', 'service', '00000000-0000-4000-8000-000000000d04',
   'archived', now() - interval '2 days', now() - interval '1 day');
insert into public.pages (id, slug, title) values
  ('00000000-0000-4000-8000-000000000f02', 'pagina-dbx04', 'Página');

-- Roda o comando e as verificações adiadas juntos, como um commit faria.
create function pg_temp.check(p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;
  set constraints all deferred;
end;
$$;
grant execute on function pg_temp.check(text) to authenticated;

create function pg_temp.check_sql(p_sql text) returns text language sql as $$
  select format('select pg_temp.check(%L)', p_sql)
$$;
grant execute on function pg_temp.check_sql(text) to authenticated;

-- ─── Definição ───────────────────────────────────────────────────────────────
select is(
  (select count(*)::int from pg_trigger where tgname like '%\_publication\_state' and not tgisinternal),
  6, 'as seis tabelas publicáveis têm o trigger de estado');
select is(
  (select count(*)::int from pg_trigger where tgname like '%\_publication\_integrity'
     and tgdeferrable and tginitdeferred),
  7, 'as verificações entre tabelas são adiadas para o fim da transação');
select is(
  (select bool_or(has_function_privilege(r, p.oid, 'execute'))
   from pg_proc p, unnest(array['anon', 'authenticated', 'service_role']) r
   where p.proname in ('enforce_publication_state', 'enforce_publication_integrity',
                       'assert_media_described', 'assert_service_publishable', 'assert_case_publishable')),
  false, 'nenhuma função nova fica disponível pela API');

-- ─── Estados inválidos e slug ────────────────────────────────────────────────
select throws_ok($$update public.areas set status = 'revisao' where id = '00000000-0000-4000-8000-000000000b01'$$,
  '22P02', null, 'status fora do enum');
select throws_ok($$insert into public.areas (slug, name) values ('area-dbx04-1', 'Repetida')$$,
  '23505', null, 'slug duplicado');
select throws_ok($$insert into public.areas (slug, name) values ('Slug Inválido', 'Área')$$,
  '23514', null, 'slug fora do formato');
select throws_ok($$insert into public.cases (slug, title, category_id) values ('case-dbx04-fk', 'Case', '00000000-0000-4000-8000-0000000000ff')$$,
  '23503', null, 'referência inexistente');

-- ─── Catálogo de blocos (todos os papéis) ────────────────────────────────────
select throws_ok($$insert into public.blocks (page_id, type) values ('00000000-0000-4000-8000-000000000f02', 'tipo-inventado')$$,
  '23514', null, 'bloco fora do catálogo');
select lives_ok($$insert into public.blocks (page_id, type) values ('00000000-0000-4000-8000-000000000f02', 'rich-text')$$,
  'bloco do catálogo');

-- ─── Transições (todos os papéis) ────────────────────────────────────────────
select throws_ok($$update public.services set status = 'published', archived_at = null where id = '00000000-0000-4000-8000-000000000d04'$$,
  'BJ001', null, 'postgres: arquivado não vai direto para publicado');
select lives_ok($$update public.cases set status = 'draft' where id = '00000000-0000-4000-8000-000000000e02'$$,
  'manter o mesmo estado é permitido');

savepoint transicoes;
select lives_ok($$update public.areas set status = 'draft' where id = '00000000-0000-4000-8000-000000000b01'$$, 'publicado → rascunho');
select lives_ok($$update public.areas set status = 'published' where id = '00000000-0000-4000-8000-000000000b01'$$, 'rascunho → publicado, com a data mantida');
select lives_ok($$update public.areas set status = 'archived', archived_at = now() where id = '00000000-0000-4000-8000-000000000b01'$$, 'publicado → arquivado');
select lives_ok($$update public.areas set status = 'draft', archived_at = null where id = '00000000-0000-4000-8000-000000000b01'$$, 'arquivado → rascunho');
select lives_ok($$update public.areas set status = 'archived', archived_at = now() where id = '00000000-0000-4000-8000-000000000b01'$$, 'rascunho → arquivado');
rollback to savepoint transicoes;

-- ─── Data da primeira publicação (todos os papéis) ───────────────────────────
select throws_ok($$update public.cases set published_at = '2020-01-01' where id = '00000000-0000-4000-8000-000000000e01'$$,
  'BJ001', null, 'published_at não muda');
select throws_ok($$update public.cases set status = 'draft', published_at = null where id = '00000000-0000-4000-8000-000000000e01'$$,
  'BJ001', null, 'published_at não é apagado ao despublicar');

-- ─── Como postgres, regras entre tabelas não se aplicam ──────────────────────
savepoint manutencao;
select lives_ok(pg_temp.check_sql($$delete from public.case_services where case_id = '00000000-0000-4000-8000-000000000e01'$$),
  'postgres: manutenção não passa pelas regras entre tabelas');
rollback to savepoint manutencao;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000401';

-- ─── Editor: transição e arquivado ───────────────────────────────────────────
select throws_ok($$update public.services set status = 'published', archived_at = null where id = '00000000-0000-4000-8000-000000000d04'$$,
  'BJ001', null, 'editor: arquivado não vai direto para publicado');
select throws_ok($$update public.services set name = 'Editado' where id = '00000000-0000-4000-8000-000000000d04'$$,
  'BJ001', null, 'editor: item arquivado não é editado');
select throws_ok(
  format($$select * from public.save_service('00000000-0000-4000-8000-000000000d04', %L,
      jsonb_build_object('slug', 'servico-dbx04-4', 'name', 'Editado', 'summary', 's', 'description', 'd', 'examples', '[]'::jsonb,
        'icon', null, 'image_media_id', null, 'featured', false, 'sort_order', 0), '{}'::uuid[])$$,
    (select updated_at from public.services where id = '00000000-0000-4000-8000-000000000d04')),
  'BJ001', null, 'editor: save_service não edita item arquivado');

-- ─── R03: serviço publicado com área ─────────────────────────────────────────
select throws_ok(pg_temp.check_sql($$delete from public.service_areas where service_id = '00000000-0000-4000-8000-000000000d01'$$),
  'BJ003', null, 'R03: tira a última área de serviço publicado');
select throws_ok(pg_temp.check_sql($$update public.services set status = 'published', published_at = now() where id = '00000000-0000-4000-8000-000000000d03'$$),
  'BJ003', null, 'R03: publica serviço sem área');
select lives_ok(pg_temp.check_sql($$update public.services set name = 'Sem área, rascunho' where id = '00000000-0000-4000-8000-000000000d03'$$),
  'R03: rascunho pode ficar sem área');
select lives_ok(pg_temp.check_sql($$
  delete from public.service_areas where service_id = '00000000-0000-4000-8000-000000000d02';
  insert into public.service_areas (service_id, area_id) values
    ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-000000000b02');
$$), 'R03: trocar a área na mesma transação é permitido');
select throws_ok(
  format($$select pg_temp.check(format('select * from public.save_service(%%L, %%L, %%L::jsonb, %%L::uuid[])',
      '00000000-0000-4000-8000-000000000d01', %L::timestamptz,
      jsonb_build_object('slug', 'servico-dbx04-1', 'name', 'Serviço 1', 'summary', 's', 'description', 'd', 'examples', '[]'::jsonb,
        'icon', null, 'image_media_id', '00000000-0000-4000-8000-000000000a01', 'featured', false, 'sort_order', 0), '{}'))$$,
    (select updated_at from public.services where id = '00000000-0000-4000-8000-000000000d01')),
  'BJ003', null, 'R03: save_service não zera as áreas de publicado');

-- ─── R06: categoria publicada ────────────────────────────────────────────────
select throws_ok(pg_temp.check_sql($$update public.case_categories set status = 'draft' where id = '00000000-0000-4000-8000-000000000c01'$$),
  'BJ003', null, 'R06: categoria em uso não sai de publicado');
select throws_ok(pg_temp.check_sql($$update public.cases set category_id = '00000000-0000-4000-8000-000000000c02' where id = '00000000-0000-4000-8000-000000000e01'$$),
  'BJ003', null, 'R06: case publicado não aponta para categoria em rascunho');

-- ─── R07: serviço publicado ──────────────────────────────────────────────────
select throws_ok(pg_temp.check_sql($$delete from public.case_services where case_id = '00000000-0000-4000-8000-000000000e01'$$),
  'BJ003', null, 'R07: tira o último serviço de case publicado');
select throws_ok(pg_temp.check_sql($$update public.services set status = 'draft' where id = '00000000-0000-4000-8000-000000000d01'$$),
  'BJ003', null, 'R07: serviço em uso não sai de publicado');
select throws_ok(pg_temp.check_sql($$update public.cases set status = 'published', published_at = now() where id = '00000000-0000-4000-8000-000000000e02'$$),
  'BJ003', null, 'R07: publica case sem serviço publicado');
select lives_ok(pg_temp.check_sql($$
  insert into public.case_services (case_id, service_id) values
    ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-000000000d02');
  update public.cases set status = 'published', published_at = now() where id = '00000000-0000-4000-8000-000000000e02';
$$), 'case completo é publicado');
select lives_ok(pg_temp.check_sql($$
  delete from public.case_services where case_id = '00000000-0000-4000-8000-000000000e02';
  insert into public.case_services (case_id, service_id) values
    ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-000000000d01');
$$), 'R07: trocar o serviço na mesma transação é permitido');

-- ─── R12: texto alternativo ──────────────────────────────────────────────────
select throws_ok(pg_temp.check_sql($$update public.media_assets set alt_text = '  ' where id = '00000000-0000-4000-8000-000000000a01'$$),
  'BJ003', null, 'R12: apaga o alt de imagem em uso');
select throws_ok(pg_temp.check_sql($$update public.media_assets set alt_text = null where id = '00000000-0000-4000-8000-000000000a02'$$),
  'BJ003', null, 'R12: apaga o alt de imagem da galeria');
select throws_ok(pg_temp.check_sql($$update public.cases set cover_media_id = '00000000-0000-4000-8000-000000000a04' where id = '00000000-0000-4000-8000-000000000e01'$$),
  'BJ003', null, 'R12: capa sem alt');
select throws_ok(pg_temp.check_sql($$insert into public.case_media (case_id, media_id) values ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000a04')$$),
  'BJ003', null, 'R12: galeria com imagem sem alt');
select throws_ok(pg_temp.check_sql($$update public.services set image_media_id = '00000000-0000-4000-8000-000000000a04' where id = '00000000-0000-4000-8000-000000000d01'$$),
  'BJ003', null, 'R12: imagem de serviço sem alt');
select lives_ok(pg_temp.check_sql($$update public.cases set cover_media_id = '00000000-0000-4000-8000-000000000a03' where id = '00000000-0000-4000-8000-000000000e01'$$),
  'R12: imagem decorativa dispensa alt');
select lives_ok(pg_temp.check_sql($$insert into public.case_media (case_id, media_id) values ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000a05')$$),
  'R12: PDF dispensa alt');
select lives_ok(pg_temp.check_sql($$update public.media_assets set alt_text = 'Novo texto' where id = '00000000-0000-4000-8000-000000000a01'$$),
  'R12: trocar o alt é permitido');

-- ─── Ciclo completo pelo editor ──────────────────────────────────────────────
select lives_ok(pg_temp.check_sql($$update public.cases set status = 'archived', archived_at = now() where id = '00000000-0000-4000-8000-000000000e02'$$),
  'editor: arquiva case publicado');
select lives_ok(pg_temp.check_sql($$update public.cases set status = 'draft', archived_at = null where id = '00000000-0000-4000-8000-000000000e02'$$),
  'editor: restaura case arquivado');
select lives_ok(pg_temp.check_sql($$update public.cases set status = 'published' where id = '00000000-0000-4000-8000-000000000e02'$$),
  'editor: republica mantendo a data');

-- ─── Exclusão: efeito de FK e arquivado ──────────────────────────────────────
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000402';
select lives_ok(pg_temp.check_sql($$delete from public.services where id = '00000000-0000-4000-8000-000000000d04'$$),
  'admin: excluir serviço apontado por CTA arquivado limpa o destino');
select ok(
  (select target_service_id is null from public.ctas where id = '00000000-0000-4000-8000-000000000f01'),
  'o destino do CTA arquivado virou nulo');
select lives_ok(pg_temp.check_sql($$
  update public.cases set status = 'archived', archived_at = now() where id = '00000000-0000-4000-8000-000000000e02';
  delete from public.cases where id = '00000000-0000-4000-8000-000000000e02';
$$), 'admin: excluir case arquivado remove os vínculos sem acusar a regra');

reset role;

select * from finish();
rollback;
