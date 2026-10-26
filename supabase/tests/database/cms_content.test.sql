/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : cms_content.test.sql
 Descrição    : Testes pgTAP das tabelas de conteúdo: constraints, integridade referencial e RLS por papel.

 Desenvolvedor: Vinícius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 25/10/2026
 Modificado em: 25/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 25/10/2026 Vinícius Binda             Criação inicial (DB-02).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim; o conteúdo existente (seed) é esvaziado só aqui
-- dentro para as contagens serem determinísticas.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(84);

truncate public.blocks, public.pages, public.ctas, public.case_media, public.case_services, public.cases,
  public.case_categories, public.service_areas, public.services, public.areas, public.media_assets,
  public.site_settings;

-- ─── Dados de base (dono das tabelas, sem RLS) ───────────────────────────────

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin@teste.invalid'),
  ('00000000-0000-4000-8000-0000000000e1', 'editor@teste.invalid'),
  ('00000000-0000-4000-8000-0000000000f1', 'viewer@teste.invalid'),
  ('00000000-0000-4000-8000-0000000000b1', 'pending@teste.invalid');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000000e1';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000000f1';

insert into public.media_assets (id, path, mime_type, size_bytes, width, height, alt_text) values
  ('10000000-0000-4000-8000-000000000001', '2026/10/6f1c2a3b-0000-4000-8000-000000000001-capa-publicada.webp', 'image/webp', 1000, 1200, 750, 'Capa publicada'),
  ('10000000-0000-4000-8000-000000000002', '2026/10/6f1c2a3b-0000-4000-8000-000000000002-capa-rascunho.webp', 'image/webp', 1000, 1200, 750, 'Capa rascunho'),
  ('10000000-0000-4000-8000-000000000003', '/brand/cases/aventura-de-construir.webp', 'image/webp', null, 1200, 750, 'Ilustração provisória'),
  ('10000000-0000-4000-8000-000000000004', '2026/10/6f1c2a3b-0000-4000-8000-000000000004-release.pdf', 'application/pdf', 9000000, null, null, null);

insert into public.areas (id, slug, name, summary, description, status, published_at) values
  ('20000000-0000-4000-8000-000000000001', 'social-media', 'Social Media', 'Resumo', 'Descrição', 'published', now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000002', 'copywriting', 'Copywriting', null, null, 'draft', null),
  ('20000000-0000-4000-8000-000000000003', 'eventos-futuros', 'Eventos', 'Resumo', 'Descrição', 'published', now() + interval '1 day');

insert into public.services (id, slug, name, summary, description, status, published_at) values
  ('30000000-0000-4000-8000-000000000001', 'social-media', 'Social Media', 'Resumo', 'Descrição', 'published', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000002', 'copywriting', 'Copywriting', null, null, 'draft', null);
insert into public.service_areas values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002');

insert into public.case_categories (id, slug, name, status, published_at) values
  ('40000000-0000-4000-8000-000000000001', 'copywriting', 'Copywriting', 'published', now() - interval '1 day');

insert into public.cases (id, slug, title, client_name, category_id, summary, cover_media_id, status, published_at) values
  ('50000000-0000-4000-8000-000000000001', 'aventura-de-construir', 'Conteúdo para blog', 'Aventura de Construir',
   '40000000-0000-4000-8000-000000000001', 'Artigos e textos desenvolvidos para o blog do cliente.',
   '10000000-0000-4000-8000-000000000001', 'published', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000002', 'case-rascunho', 'Case em rascunho', null, null, null,
   '10000000-0000-4000-8000-000000000002', 'draft', null);
insert into public.case_services values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001');
insert into public.case_media values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 0),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 0);

insert into public.pages (id, slug, title, status, published_at) values
  ('60000000-0000-4000-8000-000000000001', 'sobre', 'Sobre', 'published', now() - interval '1 day'),
  ('60000000-0000-4000-8000-000000000002', 'nova-pagina-teste', 'Rascunho', 'draft', null);
insert into public.blocks (page_id, type, content, sort_order) values
  ('60000000-0000-4000-8000-000000000001', 'hero', '{"title":"Oi"}', 0),
  ('60000000-0000-4000-8000-000000000002', 'texto', '{"body":"segredo"}', 0);

insert into public.ctas (id, label, placement, target_kind, target_path, status, published_at) values
  ('70000000-0000-4000-8000-000000000001', 'Ver cases', 'home-highlight', 'internal', '/cases', 'published', now() - interval '1 day');
insert into public.ctas (id, label, placement, target_kind, target_service_id, status, published_at) values
  ('70000000-0000-4000-8000-000000000002', 'Quero este', 'service-detail', 'contact', '30000000-0000-4000-8000-000000000002', 'draft', null);

insert into public.site_settings (name, short_name, tagline, description) values
  ('Agência Benjamin', 'Benja', 'Somando diferenças', 'Agência experimental de comunicação da FECAP.');

-- ─── Constraints: dados inválidos são recusados ──────────────────────────────

select throws_ok($$insert into public.areas (slug, name) values ('Social Media', 'X1')$$, '23514', null, 'slug com maiúscula/espaço');
select throws_ok($$insert into public.areas (slug, name) values ('admin', 'X1')$$, '23514', null, 'slug reservado');
select throws_ok($$insert into public.areas (slug, name) values ('ab', 'X1')$$, '23514', null, 'slug curto');
select throws_ok($$insert into public.areas (slug, name) values ('social-media', 'X1')$$, '23505', null, 'slug duplicado no mesmo tipo');
select lives_ok($$insert into public.case_categories (slug, name) values ('social-media', 'X1')$$, 'mesmo slug em tipos diferentes');
select throws_ok($$insert into public.areas (slug, name, summary, description, status) values ('area-x', 'X1', 'a', 'b', 'published')$$, '23514', null, 'publicado sem published_at');
select throws_ok($$insert into public.areas (slug, name, status, published_at) values ('area-x', 'X1', 'published', now())$$, '23514', null, 'área publicada sem resumo');
select throws_ok($$insert into public.areas (slug, name, status) values ('area-x', 'X1', 'archived')$$, '23514', null, 'arquivado sem archived_at');
select throws_ok($$insert into public.areas (slug, name, archived_at) values ('area-x', 'X1', now())$$, '23514', null, 'rascunho com archived_at');
select throws_ok($$insert into public.areas (slug, name, summary) values ('area-x', 'X1', repeat('a', 201))$$, '23514', null, 'resumo de área > 200');
select throws_ok($$insert into public.cases (slug, title, client_name, category_id, summary, status, published_at) values ('case-x', 'Case', 'Cli', '40000000-0000-4000-8000-000000000001', repeat('a', 40), 'published', now())$$, '23514', null, 'case publicado sem capa');
select throws_ok($$insert into public.cases (slug, title, client_name, category_id, summary, cover_media_id, status, published_at) values ('case-x', 'Case', 'Cli', '40000000-0000-4000-8000-000000000001', 'curto', '10000000-0000-4000-8000-000000000001', 'published', now())$$, '23514', null, 'case publicado com resumo < 30');
select throws_ok($$insert into public.cases (slug, title, client_name, category_id, cover_media_id, status, published_at) values ('case-x', 'Case', 'Cli', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'published', now())$$, '23514', null, 'case publicado sem resumo');
select throws_ok($$insert into public.cases (slug, title, category_id) values ('case-x', 'Case', gen_random_uuid())$$, '23503', null, 'case com categoria inexistente');
select throws_ok($$insert into public.cases (slug, title, external_links) values ('case-x', 'Case', '[{"label":"Site","url":"http://x.com"}]')$$, '23514', null, 'link externo http');
select throws_ok($$insert into public.cases (slug, title, external_links) values ('case-x', 'Case', '[{"url":"https://x.com"}]')$$, '23514', null, 'link externo sem rótulo');
select throws_ok($$insert into public.cases (slug, title, external_links) values ('case-x', 'Case', '{}')$$, '23514', null, 'external_links que não é lista');
select lives_ok($$insert into public.cases (slug, title, external_links) values ('case-links', 'Case', '[{"label":"Site","url":"https://x.com/a"}]')$$, 'link externo válido');
select throws_ok($$insert into public.cases (slug, title, reference_month) values ('case-x', 'Case', '2026-10-15')$$, '23514', null, 'mês de referência fora do dia 1');
select throws_ok($$insert into public.cases (slug, title, team) values ('case-x', 'Case', array_fill('Pessoa'::text, array[21]))$$, '23514', null, 'equipe com mais de 20 pessoas');
select throws_ok($$insert into public.ctas (label, placement, target_kind) values ('Ir', 'footer', 'internal')$$, '23514', null, 'CTA interno sem caminho');
select throws_ok($$insert into public.ctas (label, placement, target_kind, target_url) values ('Ir', 'footer', 'service', 'https://x.com')$$, '23514', null, 'CTA de serviço com URL');
select throws_ok($$insert into public.ctas (label, placement, target_kind, target_url) values ('Ir', 'footer', 'external', 'http://x.com')$$, '23514', null, 'CTA externo http');
select throws_ok($$insert into public.ctas (label, placement, target_kind, target_path) values ('Ir', 'footer', 'internal', '//evil.com')$$, '23514', null, 'CTA com caminho //host');
select throws_ok($$insert into public.ctas (label, placement, target_kind, target_path) values ('Ir', 'sidebar', 'internal', '/')$$, '23514', null, 'CTA com local inválido');
select throws_ok($$insert into public.ctas (label, placement, target_kind, target_path) values (repeat('a', 41), 'footer', 'internal', '/')$$, '23514', null, 'CTA com rótulo > 40');
select throws_ok($$insert into public.media_assets (path, mime_type, size_bytes) values ('2026/10/a-b.png', 'image/webp', 10)$$, '23514', null, 'mídia com extensão diferente do MIME');
select throws_ok($$insert into public.media_assets (path, mime_type, size_bytes) values ('2026/10/a-b.png', 'image/png', 6000000)$$, '23514', null, 'imagem > 5 MB');
select throws_ok($$insert into public.media_assets (path, mime_type, size_bytes) values ('2026/10/a-b.pdf', 'application/pdf', 11000000)$$, '23514', null, 'PDF > 10 MB');
select throws_ok($$insert into public.media_assets (path, mime_type, width) values ('2026/10/a-b.pdf', 'application/pdf', 10)$$, '23514', null, 'PDF com dimensões');
select throws_ok($$insert into public.media_assets (path, mime_type) values ('2026/10/a-b.svg', 'image/svg+xml')$$, '23514', null, 'SVG recusado');
select throws_ok($$insert into public.media_assets (path, mime_type) values ('https://x.supabase.co/a.png', 'image/png')$$, '23514', null, 'URL em vez de caminho');
select throws_ok($$insert into public.media_assets (path, mime_type, width) values ('2026/10/a-b.png', 'image/png', 4001)$$, '23514', null, 'imagem > 4000 px');
select throws_ok($$insert into public.blocks (page_id, type, content) values ('60000000-0000-4000-8000-000000000001', 'hero', '[]')$$, '23514', null, 'bloco com content que não é objeto');
select throws_ok($$insert into public.blocks (page_id, type) values ('60000000-0000-4000-8000-000000000001', 'Hero Grande')$$, '23514', null, 'bloco com tipo inválido');
select throws_ok($$insert into public.site_settings (id, name, short_name, tagline, description) values (false, 'X1', 'X1', 'x', 'x')$$, '23514', null, 'segunda linha de configuração');
select throws_ok($$insert into public.site_settings (name, short_name, tagline, description) values ('X1', 'X1', 'x', 'x')$$, '23505', null, 'configuração duplicada');

-- ─── Integridade referencial ─────────────────────────────────────────────────

select throws_ok($$delete from public.media_assets where id = '10000000-0000-4000-8000-000000000001'$$, '23503', null, 'mídia em uso como capa não é excluída');
select throws_ok($$delete from public.media_assets where id = '10000000-0000-4000-8000-000000000003'$$, '23503', null, 'mídia em uso na galeria não é excluída');
select throws_ok($$delete from public.case_categories where id = '40000000-0000-4000-8000-000000000001'$$, '23503', null, 'categoria com cases não é excluída');

savepoint exclusoes;
delete from public.services where id = '30000000-0000-4000-8000-000000000002';
select is((select count(*) from public.service_areas where service_id = '30000000-0000-4000-8000-000000000002'), 0::bigint,
  'excluir serviço remove os vínculos com áreas');
select is((select count(*) from public.ctas where id = '70000000-0000-4000-8000-000000000002' and target_service_id is null), 1::bigint,
  'CTA para serviço excluído fica órfão (fallback)');
delete from public.pages where id = '60000000-0000-4000-8000-000000000002';
select is((select count(*) from public.blocks where page_id = '60000000-0000-4000-8000-000000000002'), 0::bigint,
  'excluir página remove os blocos');
rollback to savepoint exclusoes;

-- ─── RLS: visitante (anon) ───────────────────────────────────────────────────

set local role anon;
set local request.jwt.claim.sub = '';
select is((select count(*) from public.areas), 1::bigint, 'anon: só áreas publicadas (sem rascunho nem data futura)');
select is((select count(*) from public.services), 1::bigint, 'anon: só serviços publicados');
select is((select count(*) from public.service_areas), 1::bigint, 'anon: vínculo serviço × área só entre publicados');
select is((select count(*) from public.cases), 1::bigint, 'anon: só cases publicados');
select is((select count(*) from public.case_services), 1::bigint, 'anon: vínculo case × serviço só entre publicados');
select is((select count(*) from public.case_media), 1::bigint, 'anon: galeria só de case publicado');
select is((select count(*) from public.media_assets), 2::bigint, 'anon: mídia só em uso publicado (capa + galeria)');
select is((select count(*) from public.media_assets where id = '10000000-0000-4000-8000-000000000002'), 0::bigint, 'anon: capa do rascunho invisível');
select is((select count(*) from public.pages), 1::bigint, 'anon: só páginas publicadas');
select is((select count(*) from public.blocks), 1::bigint, 'anon: blocos só de página publicada');
select is((select count(*) from public.ctas), 1::bigint, 'anon: só CTAs publicados');
select is((select count(*) from public.site_settings), 1::bigint, 'anon: lê a configuração');
select throws_ok($$insert into public.areas (slug, name) values ('area-anon', 'X1')$$, '42501', null, 'anon: não grava áreas');
select throws_ok($$update public.cases set title = 'hack'$$, '42501', null, 'anon: não altera cases');
select throws_ok($$delete from public.blocks$$, '42501', null, 'anon: não exclui blocos');
select throws_ok($$select count(*) from public.profiles$$, '42501', null, 'anon: não lê perfis');
select throws_ok($$select count(*) from public.form_submissions$$, '42501', null, 'anon: não lê envios de formulário');
reset role;

-- ─── RLS: conta pendente ─────────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000b1';
select is((select count(*) from public.areas), 1::bigint, 'pending: vê só o publicado');
select is((select count(*) from public.blocks), 1::bigint, 'pending: blocos de rascunho invisíveis');
select throws_ok($$insert into public.areas (slug, name) values ('area-pend', 'X1')$$, '42501', null, 'pending: não cria área');
select results_eq($$with u as (update public.areas set name = 'hack' returning 1) select count(*) from u$$, $$values (0::bigint)$$, 'pending: update não afeta nada');
select throws_ok($$truncate public.areas cascade$$, '42501', null, 'authenticated: TRUNCATE negado');
reset role;

-- ─── RLS: leitor ─────────────────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000f1';
select is((select count(*) from public.areas), 3::bigint, 'viewer: vê rascunhos e agendados no painel');
select is((select count(*) from public.media_assets), 4::bigint, 'viewer: vê toda a biblioteca de mídia');
select throws_ok($$insert into public.cases (slug, title) values ('case-viewer', 'Case')$$, '42501', null, 'viewer: não cria case');
select results_eq($$with u as (update public.cases set title = 'hack' returning 1) select count(*) from u$$, $$values (0::bigint)$$, 'viewer: não edita');
reset role;

-- ─── RLS: editor ─────────────────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000e1';
select lives_ok($$insert into public.areas (id, slug, name) values ('20000000-0000-4000-8000-0000000000e1', 'area-editor', 'Área do editor')$$, 'editor: cria área em rascunho');
select is((select count(*) from public.areas where id = '20000000-0000-4000-8000-0000000000e1' and updated_by = '00000000-0000-4000-8000-0000000000e1'), 1::bigint,
  'editor: updated_by vem da sessão');
select throws_ok($$insert into public.areas (slug, name, summary, description, status, published_at) values ('area-pub', 'X1', 'a', 'b', 'published', now())$$, '42501', null, 'editor: não cria item já publicado');
select results_eq($$with u as (update public.areas set status = 'published', published_at = now(), summary = 'a', description = 'b' where id = '20000000-0000-4000-8000-0000000000e1' returning 1) select count(*) from u$$, $$values (1::bigint)$$, 'editor: publica');
select results_eq($$with u as (update public.areas set status = 'archived', archived_at = now() where id = '20000000-0000-4000-8000-0000000000e1' returning 1) select count(*) from u$$, $$values (1::bigint)$$, 'editor: arquiva');
select results_eq($$with d as (delete from public.areas where id = '20000000-0000-4000-8000-0000000000e1' returning 1) select count(*) from d$$, $$values (0::bigint)$$, 'editor: não exclui (sem area:delete)');
select results_eq($$with d as (delete from public.media_assets where id = '10000000-0000-4000-8000-000000000004' returning 1) select count(*) from d$$, $$values (0::bigint)$$, 'editor: não exclui mídia (sem media:delete)');
select lives_ok($$insert into public.media_assets (path, mime_type, size_bytes) values ('2026/10/6f1c2a3b-0000-4000-8000-0000000000e1-foto.jpg', 'image/jpeg', 100)$$, 'editor: registra mídia');
select lives_ok($$insert into public.blocks (page_id, type) values ('60000000-0000-4000-8000-000000000002', 'texto')$$, 'editor: adiciona bloco');
select results_eq($$with u as (update public.site_settings set tagline = 'hack' returning 1) select count(*) from u$$, $$values (0::bigint)$$, 'editor: não altera configuração (sem settings:edit)');
reset role;

-- ─── RLS: administrador ──────────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';
select results_eq($$with d as (delete from public.areas where id = '20000000-0000-4000-8000-000000000001' returning 1) select count(*) from d$$, $$values (0::bigint)$$, 'admin: não exclui item publicado');
select results_eq($$with d as (delete from public.areas where id = '20000000-0000-4000-8000-0000000000e1' returning 1) select count(*) from d$$, $$values (1::bigint)$$, 'admin: exclui item arquivado');
select results_eq($$with d as (delete from public.media_assets where path like '%-foto.jpg' returning 1) select count(*) from d$$, $$values (1::bigint)$$, 'admin: exclui mídia sem uso');
select results_eq($$with u as (update public.site_settings set tagline = 'Somando diferenças!' returning 1) select count(*) from u$$, $$values (1::bigint)$$, 'admin: altera configuração');
select is((select count(*) from public.site_settings where updated_by = '00000000-0000-4000-8000-0000000000a1'), 1::bigint, 'admin: updated_by na configuração');
reset role;

select * from finish();
rollback;
