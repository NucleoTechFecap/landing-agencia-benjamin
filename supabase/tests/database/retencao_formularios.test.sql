/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : retencao_formularios.test.sql
 Descrição    : pgTAP da DBX-05: último andamento, retenção suspensa, anonimização, exclusão e acesso às funções.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinicius Binda             Criação inicial (DBX-05).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim, só com dados fictícios.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(29);

insert into public.form_submissions
  (id, protocol, kind, category, payload, fingerprint, ip_hash, last_notification_error, last_activity_at, legal_hold) values
  ('00000000-0000-4000-8000-000000000501', 'AB-TES001', 'lead', 'lead:x', '{"name":"Pessoa","email":"p@teste.invalid"}', 'f1', 'ip1', null, '2020-01-01', false),
  ('00000000-0000-4000-8000-000000000502', 'AB-TES002', 'feedback', 'feedback:x',
   '{"name":"Pessoa","email":"p@teste.invalid","message":"Mensagem de teste","rating":5,"allowContact":true}', 'f2', 'ip2', 'erro antigo', '2020-01-01', false),
  ('00000000-0000-4000-8000-000000000503', 'AB-TES003', 'feedback', 'feedback:x', '{"message":"Anônimo","rating":4}', 'f3', 'ip3', null, '2020-01-01', false),
  ('00000000-0000-4000-8000-000000000504', 'AB-TES004', 'lead', 'lead:x', '{"name":"Com suspensão"}', 'f4', 'ip4', null, '2020-01-01', true),
  ('00000000-0000-4000-8000-000000000505', 'AB-TES005', 'lead', 'lead:x', '{"name":"Andamento recente"}', 'f5', 'ip5', null, '2030-01-01', false),
  ('00000000-0000-4000-8000-000000000506', 'AB-TES006', 'contact', 'contact:x', '{"name":"Contato"}', 'f6', 'ip6', null, '2020-01-01', false);

-- ─── Colunas e padrões ───────────────────────────────────────────────────────
select col_not_null('public', 'form_submissions', 'last_activity_at', 'último andamento é obrigatório');
select col_default_is('public', 'form_submissions', 'legal_hold', 'false', 'retenção não nasce suspensa');
select col_is_null('public', 'form_submissions', 'anonymized_at', 'anonimização é opcional');

-- ─── Último andamento ────────────────────────────────────────────────────────
update public.form_submissions set notification_attempts = 3, updated_at = now()
where id = '00000000-0000-4000-8000-000000000506';
select is(
  (select last_activity_at from public.form_submissions where id = '00000000-0000-4000-8000-000000000506'),
  '2020-01-01'::timestamptz, 'tentativa de notificação não conta como andamento');

savepoint andamento;
update public.form_submissions set status = 'lido' where id = '00000000-0000-4000-8000-000000000506';
select is(
  (select last_activity_at from public.form_submissions where id = '00000000-0000-4000-8000-000000000506'),
  now(), 'mudar o status conta como andamento');
rollback to savepoint andamento;

-- ─── Assuntos da retenção: sem o conteúdo do envio ───────────────────────────
select columns_are('public', 'form_submissions',
  array['id', 'protocol', 'kind', 'category', 'payload', 'fingerprint', 'ip_hash', 'source_path', 'status',
        'notification_status', 'notification_attempts', 'last_notification_error', 'created_at', 'updated_at',
        'last_activity_at', 'legal_hold', 'anonymized_at'],
  'form_submissions tem só as colunas esperadas');
select is(pg_get_function_arguments('public.retention_subjects()'::regprocedure), '', 'retention_subjects não recebe parâmetros');
select is(
  (select pg_get_function_result('public.retention_subjects()'::regprocedure)),
  'TABLE(id uuid, kind text, last_activity_at timestamp with time zone, identified boolean)',
  'retention_subjects devolve só id, tipo, data e se é identificado');
select is(
  (select identified from public.retention_subjects() where id = '00000000-0000-4000-8000-000000000502'),
  true, 'feedback com nome ou e-mail é identificado');
select is(
  (select identified from public.retention_subjects() where id = '00000000-0000-4000-8000-000000000503'),
  false, 'feedback sem nome e e-mail é anônimo');
select is(
  (select count(*)::int from public.retention_subjects() where id = '00000000-0000-4000-8000-000000000504'),
  0, 'retenção suspensa fica de fora');

-- ─── Aplicar: exclusão e anonimização ────────────────────────────────────────
select results_eq(
  $$select * from public.apply_retention(
      array['00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000504',
            '00000000-0000-4000-8000-000000000505']::uuid[],
      array['00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000501']::uuid[],
      '2026-01-01', 'rotina')$$,
  $$values (1, 1, 3)$$,
  'só conta o que mudou: suspensa, andamento depois do plano e id já excluído ficam em skipped');
select is_empty($$select 1 from public.form_submissions where id = '00000000-0000-4000-8000-000000000501'$$,
  'lead vencido foi excluído');
select isnt_empty($$select 1 from public.form_submissions where id = '00000000-0000-4000-8000-000000000504'$$,
  'envio com retenção suspensa continua');
select isnt_empty($$select 1 from public.form_submissions where id = '00000000-0000-4000-8000-000000000505'$$,
  'envio com andamento depois do plano continua');

select is(
  (select payload from public.form_submissions where id = '00000000-0000-4000-8000-000000000502'),
  '{"message":"Mensagem de teste","rating":5,"allowContact":false}'::jsonb,
  'anonimização remove nome e e-mail, mantém nota e mensagem e desliga o retorno');
select ok(
  (select ip_hash is null and fingerprint = 'anonimizado' and last_notification_error is null and anonymized_at is not null
   from public.form_submissions where id = '00000000-0000-4000-8000-000000000502'),
  'anonimização remove os hashes e o erro de notificação e registra a data');
select is(
  (select identified from public.retention_subjects() where id = '00000000-0000-4000-8000-000000000502'),
  false, 'anonimizado volta como anônimo, para ser excluído no prazo de 24 meses');

select is(
  (select metadata from public.audit_log where event = 'retention.executed' order by id desc limit 1),
  '{"origin":"rotina","deleted":1,"anonymized":1,"skipped":3}'::jsonb,
  'a auditoria registra só contagens');
select is(
  (select resource_id from public.audit_log where event = 'retention.executed' order by id desc limit 1),
  null, 'a auditoria não guarda id de envio');

select results_eq(
  $$select * from public.apply_retention(array[]::uuid[], array['00000000-0000-4000-8000-000000000506']::uuid[], now(), 'titular')$$,
  $$values (0, 0, 1)$$, 'anonimização só vale para feedback');

-- ─── Parâmetros e proteção ───────────────────────────────────────────────────
select throws_ok($$select * from public.apply_retention(array[]::uuid[], array[]::uuid[], now(), 'outra')$$,
  '22023', 'Parâmetros inválidos.', 'origem desconhecida é recusada');
select throws_ok($$select * from public.apply_retention(null, array[]::uuid[], now(), 'rotina')$$,
  '22023', 'Parâmetros inválidos.', 'lista nula é recusada');
select throws_ok($$delete from public.form_submissions where id = '00000000-0000-4000-8000-000000000504'$$,
  'BJ004', null, 'envio com retenção suspensa não é excluído nem por SQL direto');

-- ─── Acesso ──────────────────────────────────────────────────────────────────
select is(has_function_privilege('authenticated', 'public.apply_retention(uuid[],uuid[],timestamptz,text)', 'execute'),
  false, 'sessão do painel não aplica a retenção');
select is(has_function_privilege('anon', 'public.retention_subjects()', 'execute'),
  false, 'visitante não lista os assuntos');
select is(has_function_privilege('service_role', 'public.apply_retention(uuid[],uuid[],timestamptz,text)', 'execute'),
  true, 'o servidor aplica a retenção');

set local role authenticated;
select throws_ok($$update public.form_submissions set legal_hold = false$$,
  '42501', null, 'sessão do painel não muda a retenção suspensa');
select throws_ok($$update public.form_submissions set last_activity_at = now()$$,
  '42501', null, 'sessão do painel não muda o último andamento');
reset role;

select * from finish();
rollback;
