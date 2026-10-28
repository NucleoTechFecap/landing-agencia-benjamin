/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : storage_media.test.sql
 Descrição    : Testes pgTAP do bucket de mídia (listagem e limpeza de órfãos) e do EXECUTE das funções administrativas.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 27/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 27/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim. O gatilho protect_delete do Storage bloqueia DELETE
-- direto por SQL; storage.allow_delete_query libera só aqui, para exercitar as políticas de RLS.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local storage.allow_delete_query = 'true';

select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000001a1', 'admin-midia@teste.invalid'),
  ('00000000-0000-4000-8000-0000000001e1', 'editor-midia@teste.invalid'),
  ('00000000-0000-4000-8000-0000000001e2', 'outro-editor-midia@teste.invalid'),
  ('00000000-0000-4000-8000-0000000001f1', 'leitor-midia@teste.invalid');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000001a1';
update public.profiles set role = 'editor' where id in ('00000000-0000-4000-8000-0000000001e1', '00000000-0000-4000-8000-0000000001e2');
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000001f1';

-- Três arquivos do editor e1/e2: um registrado na biblioteca (capa de rascunho) e dois órfãos.
insert into storage.objects (bucket_id, name, owner_id) values
  ('media', '2026/10/aaaaaaaa-0000-4000-8000-000000000001-capa-rascunho.webp', '00000000-0000-4000-8000-0000000001e1'),
  ('media', '2026/10/aaaaaaaa-0000-4000-8000-000000000002-envio-orfao.webp', '00000000-0000-4000-8000-0000000001e1'),
  ('media', '2026/10/aaaaaaaa-0000-4000-8000-000000000003-orfao-de-outro.webp', '00000000-0000-4000-8000-0000000001e2');
insert into public.media_assets (path, mime_type, size_bytes, width, height, alt_text) values
  ('2026/10/aaaaaaaa-0000-4000-8000-000000000001-capa-rascunho.webp', 'image/webp', 1000, 1200, 750, 'Capa de rascunho');

-- ─── Listagem ───────────────────────────────────────────────────────────────

set local role anon;
set local request.jwt.claim.sub = '';
select is((select count(*) from storage.objects where bucket_id = 'media'), 0::bigint,
  'anon: não lista o bucket de mídia (nem arquivos de rascunho)');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000001f1';
select is((select count(*) from storage.objects where name like '2026/10/aaaaaaaa-%'), 3::bigint,
  'viewer: lista a biblioteca no painel (media:view)');
reset role;

-- ─── Limpeza de envio órfão ─────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000001e1';
select results_eq(
  $$with d as (delete from storage.objects where name = '2026/10/aaaaaaaa-0000-4000-8000-000000000001-capa-rascunho.webp' returning 1) select count(*) from d$$,
  $$values (0::bigint)$$,
  'editor: não apaga arquivo registrado na biblioteca (exige media:delete)'
);
select results_eq(
  $$with d as (delete from storage.objects where name = '2026/10/aaaaaaaa-0000-4000-8000-000000000003-orfao-de-outro.webp' returning 1) select count(*) from d$$,
  $$values (0::bigint)$$,
  'editor: não apaga órfão enviado por outra pessoa'
);
select results_eq(
  $$with d as (delete from storage.objects where name = '2026/10/aaaaaaaa-0000-4000-8000-000000000002-envio-orfao.webp' returning 1) select count(*) from d$$,
  $$values (1::bigint)$$,
  'editor: apaga o próprio envio que ficou sem registro'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000001f1';
select results_eq(
  $$with d as (delete from storage.objects where name = '2026/10/aaaaaaaa-0000-4000-8000-000000000003-orfao-de-outro.webp' returning 1) select count(*) from d$$,
  $$values (0::bigint)$$,
  'viewer: não apaga arquivo nenhum'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000001a1';
select results_eq(
  $$with d as (delete from storage.objects where name = '2026/10/aaaaaaaa-0000-4000-8000-000000000001-capa-rascunho.webp' returning 1) select count(*) from d$$,
  $$values (1::bigint)$$,
  'admin: apaga arquivo registrado (media:delete)'
);
reset role;

-- ─── EXECUTE das funções administrativas ────────────────────────────────────

-- Checa o privilégio, não a chamada: as funções já recusam anon pela falta de sessão (42501),
-- então uma chamada falharia com ou sem o EXECUTE.
select is(has_function_privilege('anon', 'public.record_audit_event(text, text, text, text, jsonb, text)', 'execute'),
  false, 'anon: sem EXECUTE em record_audit_event');
select is(has_function_privilege('anon', 'public.assign_role(uuid, public.app_role)', 'execute'),
  false, 'anon: sem EXECUTE em assign_role');
select is(has_function_privilege('anon', 'public.set_profile_active(uuid, boolean)', 'execute'),
  false, 'anon: sem EXECUTE em set_profile_active');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000001e1';
select lives_ok(
  $$select public.record_audit_event('auth.logout', 'session')$$,
  'authenticated: continua registrando eventos de auditoria'
);
reset role;

select * from finish();
rollback;
