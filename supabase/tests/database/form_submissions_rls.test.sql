/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : form_submissions_rls.test.sql
 Descrição    : Quem consulta e altera leads, contatos e feedbacks, papel por papel.

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
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-06).
──────────────────────────────────────────────────────────────────────────────
*/

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(26);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000006a1', 'admin-envios@teste.invalid'),
  ('00000000-0000-4000-8000-0000000006b1', 'superadmin-envios@teste.invalid'),
  ('00000000-0000-4000-8000-0000000006e1', 'editor-envios@teste.invalid'),
  ('00000000-0000-4000-8000-0000000006f1', 'viewer-envios@teste.invalid'),
  ('00000000-0000-4000-8000-0000000006c1', 'pendente-envios@teste.invalid');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000006a1';
update public.profiles set role = 'super_admin' where id = '00000000-0000-4000-8000-0000000006b1';
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000006e1';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000006f1';

insert into public.form_submissions (id, protocol, kind, category, payload, fingerprint) values
  ('00000000-0000-4000-8000-000000000601', 'AB-TEST01', 'lead', 'lead:audiovisual', '{"name":"Lead"}', 'tech06-lead'),
  ('00000000-0000-4000-8000-000000000602', 'AB-TEST02', 'contact', 'contact:imprensa', '{"name":"Contato"}', 'tech06-contact'),
  ('00000000-0000-4000-8000-000000000603', 'AB-TEST03', 'feedback', 'feedback:aluno', '{"message":"Feedback"}', 'tech06-feedback');

-- security_invoker: sem ele a view roda como o dono (postgres) e ignora a RLS que se quer testar.
create temporary view tech06_visiveis with (security_invoker = true) as
  select kind from public.form_submissions where fingerprint like 'tech06-%';
grant select on tech06_visiveis to authenticated;

-- ─── Positivo: admin consulta os três tipos e altera o status ────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006a1';
select results_eq($$select kind from tech06_visiveis order by kind$$,
  array['contact', 'feedback', 'lead'], 'admin consulta lead, contato e feedback');
select lives_ok($$update public.form_submissions set status = 'em_atendimento' where fingerprint = 'tech06-lead'$$,
  'admin altera o status de um lead');
select lives_ok($$update public.form_submissions set status = 'lido' where fingerprint = 'tech06-feedback'$$,
  'admin altera o status de um feedback');
reset role;
select is((select status from public.form_submissions where fingerprint = 'tech06-lead'), 'em_atendimento',
  'o novo status do lead ficou gravado');

-- ─── Negativa: admin não reescreve o que o visitante enviou ──────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006a1';
select throws_ok($$update public.form_submissions set payload = '{}' where fingerprint = 'tech06-lead'$$,
  '42501', null, 'admin não altera o conteúdo enviado');
select throws_ok($$update public.form_submissions set kind = 'feedback' where fingerprint = 'tech06-lead'$$,
  '42501', null, 'admin não troca o tipo do envio');
select throws_ok($$update public.form_submissions set category = 'lead:outro' where fingerprint = 'tech06-lead'$$,
  '42501', null, 'admin não troca a categoria');
select throws_ok($$update public.form_submissions set notification_status = 'sent' where fingerprint = 'tech06-lead'$$,
  '42501', null, 'admin não marca notificação como enviada');
select throws_ok($$insert into public.form_submissions (id, protocol, kind, category, payload, fingerprint)
    values ('00000000-0000-4000-8000-000000000604', 'AB-TEST04', 'lead', 'lead:nao-sei', '{}', 'tech06-forjado')$$,
  '42501', null, 'nem o admin cria envio pelo painel');
reset role;

-- ─── Negativa: os demais papéis não veem nem alteram nada ────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006b1';
select is_empty($$select kind from tech06_visiveis$$, 'super_admin não consulta (minimização, N08)');
select lives_ok($$update public.form_submissions set status = 'arquivado' where fingerprint = 'tech06-contact'$$,
  'update do super_admin não dá erro de grant');
reset role;
select is((select status from public.form_submissions where fingerprint = 'tech06-contact'), 'novo',
  'mas a RLS não deixa o super_admin alterar nenhuma linha');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006e1';
select is_empty($$select kind from tech06_visiveis$$, 'editor não consulta (N05)');
select lives_ok($$delete from public.form_submissions where fingerprint = 'tech06-contact'$$,
  'delete do editor não dá erro de grant');
reset role;
select is((select count(*)::int from public.form_submissions where fingerprint = 'tech06-contact'), 1,
  'mas a RLS não deixa o editor excluir nenhuma linha');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006f1';
select is_empty($$select kind from tech06_visiveis$$, 'viewer não consulta');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006c1';
select is_empty($$select kind from tech06_visiveis$$, 'conta pendente não consulta');
reset role;

set local role anon;
select throws_ok($$select * from public.form_submissions$$, '42501', null, 'visitante não lê a tabela (N12)');
select throws_ok($$insert into public.form_submissions (id, protocol, kind, category, payload, fingerprint)
    values ('00000000-0000-4000-8000-000000000605', 'AB-TEST05', 'lead', 'lead:nao-sei', '{}', 'tech06-anon')$$,
  '42501', null, 'visitante não grava direto: só o servidor, depois de validar');
reset role;

-- ─── Borda: o tipo decide a permissão, independentemente do papel ────────────
delete from public.role_permissions where role = 'admin' and resource = 'lead' and action = 'view';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006a1';
select results_eq($$select kind from tech06_visiveis$$, array['feedback'],
  'só com feedback:view: enxerga feedback, nem lead nem contato');
reset role;

insert into public.role_permissions (role, resource, action) values ('admin', 'lead', 'view');
delete from public.role_permissions where role = 'admin' and resource = 'feedback' and action = 'view';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006a1';
select results_eq($$select kind from tech06_visiveis order by kind$$, array['contact', 'lead'],
  'só com lead:view: contato segue a regra do lead, feedback fica de fora');
reset role;
insert into public.role_permissions (role, resource, action) values ('admin', 'feedback', 'view');

-- ─── Borda: sessão sem usuário e regras da própria tabela ────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '';
select is_empty($$select kind from tech06_visiveis$$, 'sessão sem usuário não consulta');
reset role;

select throws_ok($$insert into public.form_submissions (id, protocol, kind, category, payload, fingerprint)
    values ('00000000-0000-4000-8000-000000000601', 'AB-TEST01', 'lead', 'lead:nao-sei', '{}', 'tech06-repetido')$$,
  '23505', null, 'mesmo submissionId não vira dois registros (S11)');
select throws_ok($$insert into public.form_submissions (id, protocol, kind, category, payload, fingerprint)
    values ('00000000-0000-4000-8000-000000000606', 'AB-TEST06', 'orcamento', 'x', '{}', 'tech06-tipo')$$,
  '23514', null, 'tipo fora dos três previstos é recusado');

-- ─── Positivo: a exclusão usa a mesma regra por tipo ─────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000006a1';
select lives_ok($$delete from public.form_submissions where fingerprint = 'tech06-feedback'$$,
  'admin exclui um feedback (titular/retenção)');
reset role;
select is((select count(*)::int from public.form_submissions where fingerprint = 'tech06-feedback'), 0,
  'o feedback excluído saiu da tabela');

select * from finish();
rollback;
