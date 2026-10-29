/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : cms_atomic_save.test.sql
 Descrição    : Testa segurança invoker, RLS e rollback integral das gravações do CMS.

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
 28/10/2026 Vinícius Nishimura Reis  Atomicidade e RLS em save_case (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000004e1', 'editor-atomic@teste.invalid'),
  ('00000000-0000-4000-8000-0000000004f1', 'viewer-atomic@teste.invalid');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000004e1';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000004f1';
insert into public.case_categories (slug, name)
values ('categoria-atomic-test', 'Categoria atômica');

select is(
  (select prosecdef from pg_proc where oid = 'public.save_case(uuid,timestamptz,jsonb,uuid[],uuid[])'::regprocedure),
  false,
  'save_case usa SECURITY INVOKER'
);
select is(
  has_function_privilege('anon', 'public.save_case(uuid,timestamptz,jsonb,uuid[],uuid[])', 'execute'),
  false,
  'anon não executa o RPC'
);
select is(
  has_function_privilege('authenticated', 'public.save_case(uuid,timestamptz,jsonb,uuid[],uuid[])', 'execute'),
  true,
  'authenticated pode chamar o RPC sujeito à RLS'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000004e1';
select throws_ok(
  $$select * from public.save_case(
    null, null,
    jsonb_build_object(
      'slug', 'case-atomic-test', 'title', 'Case atômico', 'sort_order', 1,
      'category_id', (select id from public.case_categories where slug = 'categoria-atomic-test')
    ),
    array['00000000-0000-4000-8000-0000000004ff'::uuid], '{}'
  )$$,
  '23503', null,
  'FK inválida ao gravar serviço falha dentro do RPC'
);
reset role;
select is((select count(*)::int from public.cases where slug = 'case-atomic-test'), 0,
  'falha de FK reverte o item da transação');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000004f1';
select throws_ok(
  $$select * from public.save_area(null, null, '{"slug":"area-atomic-test","name":"Área teste"}'::jsonb)$$,
  '42501', 'Operação não permitida.',
  'viewer não grava item por RPC'
);
reset role;

select * from finish();
rollback;
