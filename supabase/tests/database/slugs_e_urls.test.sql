/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : slugs_e_urls.test.sql
 Descrição    : pgTAP da DB-08: endereços antigos (301), endereços reservados, trava de slug e RLS.

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

-- Executar com: npx supabase db reset && npx supabase test db
-- Usa o seed (cases meridiano, fecap e aventura-de-construir publicados; um case em rascunho;
-- serviço social-media publicado). Tudo roda numa transação desfeita no fim.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(33);

create function pg_temp.resolver(p_entity text, p_slug text)
returns text
language plpgsql
as $$
declare
  v_slug text;
begin
  set local role anon;
  v_slug := public.resolve_public_slug(p_entity, p_slug);
  reset role;
  return v_slug;
end;
$$;

-- ─── Estrutura ────────────────────────────────────────────────────────────────

select has_table('public', 'slug_redirects', 'tabela de endereços antigos existe');
select ok((select relrowsecurity from pg_class where oid = 'public.slug_redirects'::regclass), 'slug_redirects com RLS');

-- ─── Resolução sem troca ──────────────────────────────────────────────────────

select is(pg_temp.resolver('case', 'meridiano'), 'meridiano', 'endereço atual de case publicado resolve para ele mesmo (200)');
select is(pg_temp.resolver('case', 'case-ficticio-em-rascunho'), null, 'rascunho não resolve (404)');
select is(pg_temp.resolver('case', 'nao-existe'), null, 'endereço inexistente não resolve (404)');
select is(pg_temp.resolver('case', 'social-media'), null, 'slug de serviço não resolve como case');
select is(pg_temp.resolver('service', 'servico-ficticio-arquivado'), null, 'serviço arquivado não resolve (404)');

-- ─── Troca de endereço ────────────────────────────────────────────────────────

update public.cases set slug = 'case-rascunho-renomeado' where slug = 'case-ficticio-em-rascunho';
select is_empty($$select 1 from public.slug_redirects where old_slug = 'case-ficticio-em-rascunho'$$,
  'rascunho que nunca foi ao ar troca de endereço sem registrar o antigo');

update public.cases set slug = 'meridiano-2026' where slug = 'meridiano';
select is((select entity_id from public.slug_redirects where entity_type = 'case' and old_slug = 'meridiano'),
  (select id from public.cases where slug = 'meridiano-2026'), 'case publicado: endereço antigo aponta para o id do item');
select is(pg_temp.resolver('case', 'meridiano'), 'meridiano-2026', 'endereço antigo resolve para o atual (301)');
select is(pg_temp.resolver('case', 'meridiano-2026'), 'meridiano-2026', 'endereço novo resolve para ele mesmo (200)');

update public.cases set slug = 'meridiano-portfolio' where slug = 'meridiano-2026';
select is(pg_temp.resolver('case', 'meridiano'), 'meridiano-portfolio', 'trocas seguidas: o primeiro endereço vai direto ao atual');
select is(pg_temp.resolver('case', 'meridiano-2026'), 'meridiano-portfolio', 'trocas seguidas: o intermediário também');

update public.cases set slug = 'meridiano' where slug = 'meridiano-portfolio';
select is_empty($$select 1 from public.slug_redirects where entity_type = 'case' and old_slug = 'meridiano'$$,
  'voltar a um endereço antigo do próprio item tira o redirecionamento dele');
select is(pg_temp.resolver('case', 'meridiano-portfolio'), 'meridiano', 'e o endereço abandonado passa a redirecionar');

update public.services set slug = 'social-media-e-conteudo' where slug = 'social-media';
select is(pg_temp.resolver('service', 'social-media'), 'social-media-e-conteudo', 'serviço: endereço antigo resolve para o atual');
select is(pg_temp.resolver('case', 'social-media'), null, 'endereço antigo de serviço não vale para case');

-- ─── Sem colisão ──────────────────────────────────────────────────────────────

select throws_ok($$update public.cases set slug = 'meridiano-2026' where slug = 'fecap'$$, '23505', null,
  'outro item não assume endereço antigo de um case');
select throws_ok(
  $$insert into public.cases (slug, title) values ('meridiano-portfolio', 'Outro case')$$, '23505', null,
  'case novo não nasce com endereço antigo de outro case');
select lives_ok($$insert into public.services (slug, name) values ('meridiano-portfolio', 'Outro serviço')$$,
  'o mesmo endereço continua livre em outro tipo');

-- ─── Visibilidade ─────────────────────────────────────────────────────────────

update public.cases set status = 'draft' where slug = 'meridiano';
select is(pg_temp.resolver('case', 'meridiano-portfolio'), null, 'endereço antigo de item despublicado não resolve (404)');
set local role anon;
select is_empty($$select 1 from public.slug_redirects where entity_type = 'case' and old_slug = 'meridiano-portfolio'$$,
  'visitante não vê endereços antigos de item fora do ar');
select isnt_empty($$select 1 from public.slug_redirects where old_slug = 'social-media'$$,
  'visitante vê endereços antigos de item no ar');
reset role;

-- ─── Exclusão: endereço reservado ─────────────────────────────────────────────

update public.cases set slug = 'fecap-2026' where slug = 'fecap';
delete from public.ctas where target_case_id = (select id from public.cases where slug = 'fecap-2026');
delete from public.cases where slug = 'fecap-2026';
select is((select count(*) from public.slug_redirects where entity_type = 'case' and old_slug in ('fecap', 'fecap-2026') and entity_id is null),
  2::bigint, 'excluir item já publicado reserva o endereço atual e os antigos');
select is(pg_temp.resolver('case', 'fecap'), null, 'endereço reservado responde 404');
select throws_ok($$insert into public.cases (slug, title) values ('fecap', 'Outro case')$$, '23505', null,
  'endereço reservado não volta a ser usado');

delete from public.cases where slug = 'case-rascunho-renomeado';
select is_empty($$select 1 from public.slug_redirects where old_slug = 'case-rascunho-renomeado'$$,
  'excluir rascunho que nunca foi ao ar libera o endereço');

-- ─── Slug fixo de área, categoria e página ───────────────────────────────────

select throws_ok($$update public.areas set slug = 'criacao-2' where slug = 'criacao'$$, '23514', null,
  'área publicada não troca de endereço');
select throws_ok($$update public.case_categories set slug = 'copy' where slug = 'copywriting'$$, '23514', null,
  'categoria publicada não troca de endereço');
insert into public.pages (slug, title, status, published_at) values ('pagina-db08', 'Página', 'published', now());
select throws_ok($$update public.pages set slug = 'pagina-db08-2' where slug = 'pagina-db08'$$, '23514', null,
  'página publicada não troca de endereço');
insert into public.areas (slug, name) values ('area-db08-rascunho', 'Rascunho');
select lives_ok($$update public.areas set slug = 'area-db08-renomeada' where slug = 'area-db08-rascunho'$$,
  'área em rascunho troca de endereço');

-- ─── Painel ───────────────────────────────────────────────────────────────────

insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000008e1', 'editor-db08@teste.invalid');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000008e1';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000008e1';
select throws_ok($$insert into public.slug_redirects (entity_type, old_slug, entity_id) values ('case', 'forjado', null)$$,
  '42501', null, 'editor não grava endereços diretamente');
update public.cases set slug = 'aventura' where slug = 'aventura-de-construir';
select isnt_empty($$select 1 from public.slug_redirects where old_slug = 'aventura-de-construir'$$,
  'editor troca o endereço pelo painel e o trigger registra o antigo');
reset role;

select * from finish();
rollback;
