/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : form_submissions_integridade.test.sql
 Descrição    : O banco aceita o que a aplicação grava e recusa envio com forma inválida.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 09/11/2026
 Modificado em: 09/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 09/11/2026 Vinicius Binda           Criação inicial (DB-06).
──────────────────────────────────────────────────────────────────────────────
*/

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(40);

-- Um lead como `processSubmission` grava. Cada caso troca só o campo que testa.
create function pg_temp.db06_envio(
  p_kind text default 'lead',
  p_category text default 'lead:audiovisual',
  p_protocol text default 'AB-0DB060',
  p_payload jsonb default '{"name": "Pessoa DB-06", "email": "pessoa@teste.invalid", "privacyConsent": true}',
  p_source_path text default '/contato',
  p_attempts integer default 0,
  p_error text default null
) returns void
language sql
as $$
  insert into public.form_submissions
    (id, protocol, kind, category, payload, fingerprint, source_path, notification_attempts, last_notification_error)
  values (gen_random_uuid(), p_protocol, p_kind, p_category, p_payload, 'db06-integridade', p_source_path, p_attempts, p_error);
$$;

create function pg_temp.db06_violacao(p_constraint text) returns text
language sql
as $$ select format('new row for relation "form_submissions" violates check constraint "%s"', p_constraint) $$;

select bag_eq(
  $$select conname::text from pg_constraint
    where conrelid = 'public.form_submissions'::regclass and contype = 'c'
      and conname not in ('form_submissions_kind_check', 'form_submissions_status_check',
                          'form_submissions_notification_status_check')$$,
  array['form_submissions_payload_object', 'form_submissions_payload_size', 'form_submissions_category_format',
        'form_submissions_protocol_format', 'form_submissions_source_path_format',
        'form_submissions_notification_attempts', 'form_submissions_notification_error_length'],
  'as sete restrições da DB-06 estão na tabela');

-- ─── Positivo: tudo o que a aplicação grava passa ────────────────────────────
select lives_ok($$select pg_temp.db06_envio()$$, 'lead com serviço, origem e protocolo de protocolFromId');
select lives_ok($$select pg_temp.db06_envio(p_category => 'lead:nao-sei')$$, 'lead sem serviço definido (nao-sei)');
select lives_ok(
  $$select pg_temp.db06_envio('contact', 'contact:' || s)
    from unnest(array['parceria', 'imprensa', 'fazer-parte', 'duvida', 'outro']) s$$,
  'contato com cada assunto de CONTACT_SUBJECTS');
select lives_ok(
  $$select pg_temp.db06_envio('feedback', 'feedback:' || p,
      p_payload => '{"profile": "aluno", "message": "Ótimo.", "name": "Pessoa", "email": "p@teste.invalid"}')
    from unnest(array['cliente', 'parceiro', 'aluno', 'comunidade', 'outro']) p$$,
  'feedback identificado com cada perfil de FEEDBACK_PROFILES');
select lives_ok($$select pg_temp.db06_envio(p_category => 'lead:' || rpad('servico', 80, 'x'))$$,
  'serviço com 80 caracteres, o limite de SLUG_MAX_LENGTH');
select lives_ok($$select pg_temp.db06_envio(p_source_path => null)$$, 'envio sem JavaScript, sem origem');
select lives_ok($$select pg_temp.db06_envio(p_source_path => '//evil.com')$$,
  'origem com // passa, como na aplicação: o painel mostra como texto');
select lives_ok($$select pg_temp.db06_envio(p_source_path => '/' || repeat('a', 199))$$, 'origem com 200 caracteres');
select lives_ok($$select pg_temp.db06_envio(p_attempts => 5, p_error => repeat('e', 200))$$,
  'tentativas esgotadas e erro do provedor cortado em 200 caracteres');
select lives_ok($$select pg_temp.db06_envio(p_payload => jsonb_build_object('projectDescription', repeat(chr(1), 3000)))$$,
  'descrição de 3.000 caracteres que o JSON escapa em 6 bytes cabe no teto');
select lives_ok($$update public.form_submissions set payload = payload - 'name' - 'email'
    where fingerprint = 'db06-integridade' and kind = 'feedback'$$,
  'anonimização da retenção (DBX-05) continua passando');

-- ─── Conteúdo ────────────────────────────────────────────────────────────────
select throws_ok($$select pg_temp.db06_envio(p_payload => '[]')$$, '23514',
  pg_temp.db06_violacao('form_submissions_payload_object'), 'conteúdo em lista é recusado');
select throws_ok($$select pg_temp.db06_envio(p_payload => '"Pessoa"')$$, '23514',
  pg_temp.db06_violacao('form_submissions_payload_object'), 'conteúdo em texto solto é recusado');
select throws_ok($$select pg_temp.db06_envio(p_payload => jsonb_build_object('message', repeat('x', 70000)))$$, '23514',
  pg_temp.db06_violacao('form_submissions_payload_size'), 'conteúdo acima de 64 KiB é recusado');

-- ─── Categoria ───────────────────────────────────────────────────────────────
select throws_ok($$select pg_temp.db06_envio(p_category => 'feedback:aluno')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'lead com categoria de feedback é recusado');
select throws_ok($$select pg_temp.db06_envio('contact', 'lead:audiovisual')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'contato com categoria de lead é recusado');
select throws_ok($$select pg_temp.db06_envio(p_category => 'audiovisual')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'categoria sem o tipo é recusada');
select throws_ok($$select pg_temp.db06_envio(p_category => 'lead:Urgente Diretoria')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'texto livre na categoria é recusado');
select throws_ok($$select pg_temp.db06_envio(p_category => 'lead:audiovisual:urgente')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'categoria com segundo nível é recusada');
select throws_ok($$select pg_temp.db06_envio(p_category => 'lead:audiovisual-')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'categoria terminada em hífen é recusada');
select throws_ok($$select pg_temp.db06_envio(p_category => 'lead:')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'categoria sem valor é recusada');
select throws_ok($$select pg_temp.db06_envio(p_category => 'lead:' || rpad('servico', 81, 'x'))$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'serviço com 81 caracteres é recusado');

-- ─── Protocolo ───────────────────────────────────────────────────────────────
select throws_ok($$select pg_temp.db06_envio(p_protocol => 'AB-0db060')$$, '23514',
  pg_temp.db06_violacao('form_submissions_protocol_format'), 'protocolo em minúsculas é recusado');
select throws_ok($$select pg_temp.db06_envio(p_protocol => 'AB-0DB06')$$, '23514',
  pg_temp.db06_violacao('form_submissions_protocol_format'), 'protocolo curto é recusado');
select throws_ok($$select pg_temp.db06_envio(p_protocol => 'AB-TESTE1')$$, '23514',
  pg_temp.db06_violacao('form_submissions_protocol_format'), 'protocolo fora do hexadecimal é recusado');
select throws_ok($$select pg_temp.db06_envio(p_protocol => '0DB060')$$, '23514',
  pg_temp.db06_violacao('form_submissions_protocol_format'), 'protocolo sem o prefixo AB- é recusado');

-- ─── Origem e notificação ────────────────────────────────────────────────────
select throws_ok($$select pg_temp.db06_envio(p_source_path => 'contato')$$, '23514',
  pg_temp.db06_violacao('form_submissions_source_path_format'), 'origem sem barra inicial é recusada');
select throws_ok($$select pg_temp.db06_envio(p_source_path => '/contato x')$$, '23514',
  pg_temp.db06_violacao('form_submissions_source_path_format'), 'origem com espaço é recusada');
select throws_ok($$select pg_temp.db06_envio(p_source_path => '')$$, '23514',
  pg_temp.db06_violacao('form_submissions_source_path_format'), 'origem vazia é recusada: sem origem é nulo');
select throws_ok($$select pg_temp.db06_envio(p_source_path => '/' || repeat('a', 200))$$, '23514',
  pg_temp.db06_violacao('form_submissions_source_path_format'), 'origem com 201 caracteres é recusada');
select throws_ok($$select pg_temp.db06_envio(p_attempts => -1)$$, '23514',
  pg_temp.db06_violacao('form_submissions_notification_attempts'), 'tentativas negativas são recusadas');
select throws_ok($$select pg_temp.db06_envio(p_error => repeat('e', 201))$$, '23514',
  pg_temp.db06_violacao('form_submissions_notification_error_length'), 'erro do provedor acima de 200 é recusado');

-- ─── As regras valem também na alteração e para o servidor ──────────────────
select throws_ok($$update public.form_submissions set category = 'feedback:aluno'
    where fingerprint = 'db06-integridade' and kind = 'lead'$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'alteração também passa pelas regras');
select throws_ok($$update public.form_submissions set payload = '[]'
    where fingerprint = 'db06-integridade' and kind = 'contact'$$, '23514',
  pg_temp.db06_violacao('form_submissions_payload_object'), 'conteúdo não vira lista numa correção manual');

set local role service_role;
select lives_ok($$select pg_temp.db06_envio(p_protocol => 'AB-5E7F1C')$$, 'service_role grava o envio válido');
select throws_ok($$select pg_temp.db06_envio(p_protocol => 'AB-FORJAD')$$, '23514',
  pg_temp.db06_violacao('form_submissions_protocol_format'), 'service_role também é barrado: a RLS não o alcança, a restrição sim');
select throws_ok($$select pg_temp.db06_envio('feedback', 'lead:audiovisual')$$, '23514',
  pg_temp.db06_violacao('form_submissions_category_format'), 'service_role não grava feedback como lead');
reset role;

-- ─── Nada do que foi recusado ficou gravado ──────────────────────────────────
-- Válidos: lead, nao-sei, 5 contatos, 5 feedbacks, serviço de 80, sem origem, //, origem de 200,
-- tentativas esgotadas, descrição escapada e o do service_role.
select is((select count(*)::int from public.form_submissions where fingerprint = 'db06-integridade'), 19,
  'só os 19 envios válidos estão na tabela');
select is((select count(*)::int from public.form_submissions
    where fingerprint = 'db06-integridade' and (payload ? 'name' or payload ? 'email') and kind = 'feedback'), 0,
  'os feedbacks seguem anonimizados');

select * from finish();
rollback;
