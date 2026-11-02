/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : cms_gravacao_atomica.test.sql
 Descrição    : Atomicidade, RLS e concorrência de save_service e save_case.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #314).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim. Cada falha esperada é um savepoint: é o que o Postgres
-- faz com a chamada da função, então o que sobrar depois dela seria uma gravação parcial real.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(25);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000a01', 'editor-atomica@teste.invalid'),
  ('00000000-0000-4000-8000-000000000a02', 'viewer-atomica@teste.invalid');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-000000000a01';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-000000000a02';

insert into public.areas (id, slug, name) values
  ('00000000-0000-4000-8000-000000000b01', 'area-atomica-1', 'Área 1'),
  ('00000000-0000-4000-8000-000000000b02', 'area-atomica-2', 'Área 2');
insert into public.media_assets (id, path, mime_type, size_bytes, width, height, alt_text) values
  ('00000000-0000-4000-8000-000000000c01', 'atomica/1.webp', 'image/webp', 10, 10, 10, 'Um'),
  ('00000000-0000-4000-8000-000000000c02', 'atomica/2.webp', 'image/webp', 10, 10, 10, 'Dois'),
  ('00000000-0000-4000-8000-000000000c03', 'atomica/3.webp', 'image/webp', 10, 10, 10, 'Três');
insert into public.services (id, slug, name) values
  ('00000000-0000-4000-8000-000000000d01', 'servico-atomico', 'Serviço original'),
  ('00000000-0000-4000-8000-000000000d02', 'servico-atomico-2', 'Serviço 2');
insert into public.service_areas (service_id, area_id) values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-000000000b01');
insert into public.cases (id, slug, title) values
  ('00000000-0000-4000-8000-000000000e01', 'case-atomico', 'Case original');
insert into public.case_services (case_id, service_id) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000d01');
insert into public.case_media (case_id, media_id, sort_order) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000c01', 0);

create function pg_temp.service_values(p_name text, p_slug text default 'servico-atomico')
returns jsonb language sql as $$
  select jsonb_build_object('slug', p_slug, 'name', p_name, 'summary', null, 'description', null,
    'examples', '[]'::jsonb, 'icon', null, 'image_media_id', null, 'featured', false, 'sort_order', 3)
$$;
create function pg_temp.case_values(p_title text, p_slug text default 'case-atomico')
returns jsonb language sql as $$
  select jsonb_build_object('slug', p_slug, 'title', p_title, 'client_name', null, 'category_id', null,
    'delivery_type', null, 'summary', null, 'challenge', null, 'solution', null, 'results', null,
    'cover_media_id', null, 'external_links', '[]'::jsonb, 'reference_month', null, 'team', '[]'::jsonb,
    'featured', false, 'sort_order', 1)
$$;
create function pg_temp.version_of(p_table text, p_id uuid)
returns timestamptz language plpgsql as $$
declare v timestamptz;
begin
  execute format('select updated_at from public.%I where id = $1', p_table) into v using p_id;
  return v;
end;
$$;
grant execute on function pg_temp.service_values(text, text), pg_temp.case_values(text, text),
  pg_temp.version_of(text, uuid) to authenticated;

-- ─── Definição ───────────────────────────────────────────────────────────────
select is(
  (select bool_or(prosecdef) from pg_proc where proname in ('save_service', 'save_case')),
  false, 'as duas funções são security invoker');
select is(
  (select count(*)::int from pg_proc where proname in ('save_service', 'save_case') and proconfig = array['search_path=""']),
  2, 'as duas funções fixam o search_path vazio');
select is(
  has_function_privilege('anon', 'public.save_case(uuid,timestamptz,jsonb,uuid[],uuid[])', 'execute'),
  false, 'visitante não executa save_case');
select is(
  has_function_privilege('anon', 'public.save_service(uuid,timestamptz,jsonb,uuid[])', 'execute'),
  false, 'visitante não executa save_service');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000a01';

-- ─── Sucesso ─────────────────────────────────────────────────────────────────
select lives_ok(
  $$select * from public.save_service(null, null, pg_temp.service_values('Serviço criado', 'servico-criado-atomico'),
      array['00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-000000000b02',
            '00000000-0000-4000-8000-000000000b01']::uuid[])$$,
  'editor cria serviço com áreas, mesmo com id repetido');
select is(
  (select status::text from public.services where slug = 'servico-criado-atomico'),
  'draft', 'o item criado nasce rascunho');
select is(
  (select count(*)::int from public.service_areas sa join public.services s on s.id = sa.service_id
   where s.slug = 'servico-criado-atomico'),
  2, 'as áreas entram sem repetição');

select lives_ok(
  format($$select * from public.save_case('00000000-0000-4000-8000-000000000e01', %L, pg_temp.case_values('Case editado'),
      array['00000000-0000-4000-8000-000000000d02']::uuid[],
      array['00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-000000000c02',
            '00000000-0000-4000-8000-000000000c03']::uuid[])$$,
    pg_temp.version_of('cases', '00000000-0000-4000-8000-000000000e01')),
  'editor edita case, serviços e galeria');
select is(
  (select array_agg(media_id order by sort_order) from public.case_media
   where case_id = '00000000-0000-4000-8000-000000000e01'),
  array['00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-000000000c02']::uuid[],
  'a galeria fica na ordem dada, sem repetição e sem a imagem que saiu');
select is(
  (select array_agg(service_id) from public.case_services where case_id = '00000000-0000-4000-8000-000000000e01'),
  array['00000000-0000-4000-8000-000000000d02']::uuid[],
  'o serviço que saiu não fica vinculado');

-- ─── Atomicidade: falha em qualquer etapa desfaz tudo ────────────────────────
select throws_ok(
  format($$select * from public.save_service('00000000-0000-4000-8000-000000000d01', %L, pg_temp.service_values('Não deve ficar'),
      array['00000000-0000-4000-8000-0000000000ff']::uuid[])$$,
    pg_temp.version_of('services', '00000000-0000-4000-8000-000000000d01')),
  '23503', null, 'área inexistente falha com erro de FK');
select is(
  (select name from public.services where id = '00000000-0000-4000-8000-000000000d01'),
  'Serviço original', 'falha na área desfaz o texto do serviço');
select is(
  (select array_agg(area_id) from public.service_areas where service_id = '00000000-0000-4000-8000-000000000d01'),
  array['00000000-0000-4000-8000-000000000b01']::uuid[], 'falha na área mantém os vínculos antigos');

select throws_ok(
  format($$select * from public.save_case('00000000-0000-4000-8000-000000000e01', %L, pg_temp.case_values('Não deve ficar'),
      array['00000000-0000-4000-8000-000000000d01']::uuid[],
      array['00000000-0000-4000-8000-0000000000ff']::uuid[])$$,
    pg_temp.version_of('cases', '00000000-0000-4000-8000-000000000e01')),
  '23503', null, 'imagem inexistente na galeria falha com erro de FK');
select is(
  (select title from public.cases where id = '00000000-0000-4000-8000-000000000e01'),
  'Case editado', 'falha na galeria (última etapa) desfaz o texto do case');
select is(
  (select array_agg(service_id) from public.case_services where case_id = '00000000-0000-4000-8000-000000000e01'),
  array['00000000-0000-4000-8000-000000000d02']::uuid[], 'falha na galeria desfaz a troca de serviços já feita');
select is(
  (select count(*)::int from public.case_media where case_id = '00000000-0000-4000-8000-000000000e01'),
  2, 'falha na galeria mantém a galeria antiga');

select throws_ok(
  $$select * from public.save_case(null, null, pg_temp.case_values('Novo', 'case-novo-atomico'),
      array['00000000-0000-4000-8000-0000000000ff']::uuid[], '{}')$$,
  '23503', null, 'criar case com serviço inexistente falha');
select is(
  (select count(*)::int from public.cases where slug = 'case-novo-atomico'),
  0, 'a falha não deixa rascunho para trás');

-- ─── Concorrência e parâmetros ───────────────────────────────────────────────
select throws_ok(
  $$select * from public.save_service('00000000-0000-4000-8000-000000000d01', '2000-01-01', pg_temp.service_values('Atrasado'), '{}')$$,
  '40001', 'O conteúdo foi alterado por outra pessoa.', 'versão desatualizada é recusada');
select throws_ok(
  $$select * from public.save_service('00000000-0000-4000-8000-0000000000ff', '2000-01-01', pg_temp.service_values('Sumiu'), '{}')$$,
  'P0002', 'Serviço não encontrado.', 'item inexistente é informado');
select throws_ok(
  $$select * from public.save_service(null, null, pg_temp.service_values('Forjado', 'servico-forjado') || '{"status":"published"}', '{}')$$,
  '22023', 'Parâmetros inválidos.', 'campo de controle no formulário é recusado');
select throws_ok(
  format($$select * from public.save_service('00000000-0000-4000-8000-000000000d01', %L, pg_temp.service_values('Sem áreas'), null)$$,
    pg_temp.version_of('services', '00000000-0000-4000-8000-000000000d01')),
  '22023', 'Parâmetros inválidos.', 'lista nula não apaga os vínculos');
select throws_ok(
  $$select * from public.save_service(null, null, pg_temp.service_values('Sem chave', 'servico-sem-chave') - 'sort_order', '{}')$$,
  '22023', 'Parâmetros inválidos.', 'coluna ausente não vira valor apagado');

-- ─── Permissão ───────────────────────────────────────────────────────────────
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000a02';
select throws_ok(
  $$select * from public.save_case(null, null, pg_temp.case_values('Do leitor', 'case-do-leitor'), '{}', '{}')$$,
  '42501', 'Operação não permitida.', 'leitor não grava');

reset role;

select * from finish();
rollback;
