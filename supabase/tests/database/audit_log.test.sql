/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : audit_log.test.sql
 Descrição    : Testes pgTAP da trilha de auditoria: append-only e anonimização do ator ao excluir a conta.

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
-- Tudo roda numa transação desfeita no fim.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000c1', 'ator-auditado@teste.invalid'),
  ('00000000-0000-4000-8000-0000000000c2', 'outro-ator@teste.invalid');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000000c1';

insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, metadata, request_id) values
  ('00000000-0000-4000-8000-0000000000c1', 'editor', 'content.published', 'content', 'item-1',
   '{"entity": "case", "slug": "fecap"}', 'req-1'),
  ('00000000-0000-4000-8000-0000000000c1', 'editor', 'auth.logout', 'session', null, '{}', 'req-2'),
  ('00000000-0000-4000-8000-0000000000c2', 'viewer', 'auth.logout', 'session', null, '{}', 'req-3');

-- ─── Append-only continua valendo para qualquer alteração direta ─────────────

select throws_ok(
  $$update public.audit_log set event = 'content.updated' where request_id = 'req-1'$$,
  '42501', 'audit_log é somente inclusão.',
  'UPDATE direto de um campo do evento é recusado'
);
select throws_ok(
  $$update public.audit_log set actor_id = null where request_id = 'req-1'$$,
  '42501', 'audit_log é somente inclusão.',
  'UPDATE direto que anula o ator é recusado (só a cascata da exclusão pode)'
);
select throws_ok(
  $$update public.audit_log set actor_id = '00000000-0000-4000-8000-0000000000c2' where request_id = 'req-1'$$,
  '42501', 'audit_log é somente inclusão.',
  'Trocar o ator de um evento é recusado'
);
select throws_ok(
  $$delete from public.audit_log where request_id = 'req-1'$$,
  '42501', 'audit_log é somente inclusão.',
  'DELETE de evento é recusado'
);

-- ─── Excluir a conta anonimiza os eventos dela ───────────────────────────────

select lives_ok(
  $$delete from auth.users where id = '00000000-0000-4000-8000-0000000000c1'$$,
  'Conta com eventos auditados pode ser excluída'
);
select is(
  (select count(*)::int from public.audit_log where request_id in ('req-1', 'req-2') and actor_id is null),
  2,
  'Os eventos da conta excluída ficam com actor_id nulo'
);
select is(
  (select event || '|' || actor_role::text || '|' || resource_id || '|' || (metadata ->> 'slug')
     from public.audit_log where request_id = 'req-1'),
  'content.published|editor|item-1|fecap',
  'Evento, papel, recurso e metadados do evento anonimizado ficam intactos'
);
select is(
  (select actor_id from public.audit_log where request_id = 'req-3'),
  '00000000-0000-4000-8000-0000000000c2'::uuid,
  'Eventos de outras contas não mudam'
);
select throws_ok(
  $$update public.audit_log set event = 'content.updated' where request_id = 'req-2'$$,
  '42501', 'audit_log é somente inclusão.',
  'Evento já anonimizado continua imutável'
);

select * from finish();
rollback;
