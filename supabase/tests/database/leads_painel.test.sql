/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : leads_painel.test.sql
 Descrição    : O que falta além de form_submissions_rls: privilégios, colunas, trilha e publicação.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 09/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-04).
 09/11/2026 Vinicius Binda           Protocolos no formato que a aplicação grava (DB-06).
──────────────────────────────────────────────────────────────────────────────
*/

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(46);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000007a1', 'admin-seg04@teste.invalid'),
  ('00000000-0000-4000-8000-0000000007b1', 'superadmin-seg04@teste.invalid'),
  ('00000000-0000-4000-8000-0000000007e1', 'editor-seg04@teste.invalid'),
  ('00000000-0000-4000-8000-0000000007f1', 'viewer-seg04@teste.invalid'),
  ('00000000-0000-4000-8000-0000000007c1', 'pendente-seg04@teste.invalid'),
  ('00000000-0000-4000-8000-0000000007d1', 'desativado-seg04@teste.invalid');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000007a1';
update public.profiles set role = 'super_admin' where id = '00000000-0000-4000-8000-0000000007b1';
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000007e1';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000007f1';
update public.profiles set role = 'admin', active = false where id = '00000000-0000-4000-8000-0000000007d1';

insert into public.form_submissions (id, protocol, kind, category, payload, fingerprint, updated_at) values
  ('00000000-0000-4000-8000-000000000701', 'AB-000701', 'lead', 'lead:nao-sei', '{"name":"Lead"}', 'seg04-lead', '2020-01-01'),
  ('00000000-0000-4000-8000-000000000702', 'AB-000702', 'feedback', 'feedback:aluno', '{"message":"Feedback"}', 'seg04-feedback', '2020-01-01');

create temporary view seg04_visiveis with (security_invoker = true) as
  select id from public.form_submissions where fingerprint like 'seg04-%';
grant select on seg04_visiveis to authenticated;

-- ─── Privilégios: a tabela não depende só da RLS ─────────────────────────────
select ok((select relrowsecurity from pg_class where oid = 'public.form_submissions'::regclass), 'RLS ligada');
select table_privs_are('public', 'form_submissions', 'anon', array[]::text[], 'anon não tem nenhum privilégio');
select ok(not has_table_privilege('authenticated', 'public.form_submissions', 'INSERT'), 'authenticated não grava envio');
select ok(not has_table_privilege('authenticated', 'public.form_submissions', 'UPDATE'), 'update não vale para a tabela inteira');
select ok(has_column_privilege('authenticated', 'public.form_submissions', 'status', 'UPDATE'), 'update vale para status');
select is(
  (select count(*)::int from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'form_submissions'
      and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  1, 'status é a única coluna com update para authenticated');
select is_empty($$select 1 from pg_publication_tables where tablename = 'form_submissions'$$,
  'envios fora da publicação do Realtime');

-- ─── admin: nenhuma coluna além de status ────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007a1';
select throws_ok($$update public.form_submissions set id = '00000000-0000-4000-8000-000000000799' where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca o id');
select throws_ok($$update public.form_submissions set protocol = 'AB-FORJADO' where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca o protocolo');
select throws_ok($$update public.form_submissions set source_path = '/forjado' where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca a origem');
select throws_ok($$update public.form_submissions set ip_hash = 'forjado' where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca o hash de IP');
select throws_ok($$update public.form_submissions set fingerprint = 'forjado' where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca a impressão digital');
select throws_ok($$update public.form_submissions set notification_attempts = 0 where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não zera as tentativas de notificação');
select throws_ok($$update public.form_submissions set last_notification_error = null where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não apaga o erro de notificação');
select throws_ok($$update public.form_submissions set created_at = now() where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca a data de recebimento');
select throws_ok($$update public.form_submissions set updated_at = now() where fingerprint = 'seg04-lead'$$,
  '42501', null, 'admin não troca a data de atualização');
select throws_ok($$update public.form_submissions set status = 'aprovado' where fingerprint = 'seg04-lead'$$,
  '23514', null, 'status fora da lista é recusado pelo banco');
select lives_ok($$update public.form_submissions set status = 'em_atendimento' where fingerprint = 'seg04-lead'$$,
  'status válido é aceito');
reset role;
select ok(
  (select updated_at > '2020-01-01' from public.form_submissions where fingerprint = 'seg04-lead'),
  'o trigger atualiza updated_at mesmo sem grant na coluna');

-- ─── viewer e pendente: update e delete sem efeito (o editor está em form_submissions_rls) ───
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007f1';
select lives_ok($$update public.form_submissions set status = 'arquivado' where fingerprint = 'seg04-feedback'$$,
  'update do viewer não dá erro de grant');
select lives_ok($$delete from public.form_submissions where fingerprint = 'seg04-feedback'$$,
  'delete do viewer não dá erro de grant');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007c1';
select lives_ok($$update public.form_submissions set status = 'arquivado' where fingerprint = 'seg04-feedback'$$,
  'update da conta pendente não dá erro de grant');
select lives_ok($$delete from public.form_submissions where fingerprint = 'seg04-feedback'$$,
  'delete da conta pendente não dá erro de grant');
reset role;
select results_eq($$select status from public.form_submissions where fingerprint = 'seg04-feedback'$$,
  array['novo'], 'a RLS não deixou viewer nem pendente mudar ou apagar a linha');

-- ─── Permissões isoladas: ver não dá direito de alterar nem de excluir ───────
-- O select da RLS também vale em update e delete com where, então só um papel que lê prova as duas
-- policies de escrita: sem isto, `using (true)` nelas passaria despercebido.
delete from public.role_permissions where role = 'admin' and resource = 'lead' and action in ('edit', 'delete');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007a1';
select results_eq($$select count(*)::int from seg04_visiveis where id = '00000000-0000-4000-8000-000000000701'$$,
  array[1], 'sem lead:edit e lead:delete, o admin ainda lê o lead');
select lives_ok($$update public.form_submissions set status = 'respondido' where fingerprint = 'seg04-lead'$$,
  'update sem lead:edit não dá erro de grant');
select lives_ok($$delete from public.form_submissions where fingerprint = 'seg04-lead'$$,
  'delete sem lead:delete não dá erro de grant');
reset role;
select results_eq($$select status from public.form_submissions where fingerprint = 'seg04-lead'$$,
  array['em_atendimento'], 'mas a RLS não deixou alterar nem excluir');
insert into public.role_permissions (role, resource, action) values ('admin', 'lead', 'edit'), ('admin', 'lead', 'delete');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007a1';
select lives_ok($$update public.form_submissions set status = 'respondido' where fingerprint = 'seg04-lead'$$,
  'com a permissão de volta, o update funciona');
reset role;

-- ─── Conta desativada vale como pendente, mesmo com o papel admin gravado ────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007d1';
select is_empty($$select id from seg04_visiveis$$, 'admin desativado não lê');
select lives_ok($$update public.form_submissions set status = 'arquivado' where fingerprint = 'seg04-feedback'$$,
  'update do admin desativado não dá erro de grant');
reset role;
select results_eq($$select status from public.form_submissions where fingerprint = 'seg04-feedback'$$,
  array['novo'], 'mas a RLS não deixou o admin desativado alterar');

-- ─── Visitante: nem update nem delete ────────────────────────────────────────
set local role anon;
select throws_ok($$update public.form_submissions set status = 'arquivado'$$, '42501', null, 'visitante não altera');
select throws_ok($$delete from public.form_submissions$$, '42501', null, 'visitante não exclui');
reset role;

-- ─── Trilha: a guarda do banco casa com os eventos que o painel grava ────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007a1';
select lives_ok($$select public.record_audit_event('lead.viewed', 'lead', 'seg04')$$, 'admin grava lead.viewed');
select lives_ok($$select public.record_audit_event('feedback.viewed', 'feedback', 'seg04')$$, 'admin grava feedback.viewed');
select lives_ok($$select public.record_audit_event('lead.status_changed', 'lead', 'seg04')$$, 'admin grava lead.status_changed');
select lives_ok($$select public.record_audit_event('lead.deleted', 'lead', 'seg04')$$, 'admin grava lead.deleted');
select lives_ok($$select public.record_audit_event('feedback.deleted', 'feedback', 'seg04')$$, 'admin grava feedback.deleted');
-- Quando feedback.status_changed for criado por migration, este caso muda junto com o código do painel.
select throws_ok($$select public.record_audit_event('feedback.status_changed', 'feedback', 'seg04')$$,
  '42501', null, 'feedback.status_changed não existe: o painel usa lead.status_changed com metadata.kind');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007b1';
select throws_ok($$select public.record_audit_event('lead.viewed', 'lead', 'seg04')$$,
  '42501', null, 'super_admin não registra leitura de dados pessoais');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007e1';
select throws_ok($$select public.record_audit_event('lead.status_changed', 'lead', 'seg04')$$,
  '42501', null, 'editor não registra mudança de status');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007f1';
select throws_ok($$select public.record_audit_event('feedback.viewed', 'feedback', 'seg04')$$,
  '42501', null, 'viewer não registra leitura de feedback');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007c1';
select throws_ok($$select public.record_audit_event('lead.deleted', 'lead', 'seg04')$$,
  '42501', null, 'conta pendente não registra exclusão');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000007d1';
select throws_ok($$select public.record_audit_event('lead.viewed', 'lead', 'seg04')$$,
  '42501', null, 'admin desativado não registra leitura');
reset role;

set local role anon;
select throws_ok($$select public.record_audit_event('lead.viewed', 'lead', 'seg04')$$,
  '42501', null, 'visitante não grava na trilha');
reset role;

select * from finish();
rollback;
