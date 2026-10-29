/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : audit_event_roles.test.sql
 Descrição    : Valida os papéis autorizados a registrar cada família de auditoria.

 Desenvolvedor: Codex

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Codex                     Testa a autorização de eventos (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000003f1', 'viewer-eventos@teste.invalid'),
  ('00000000-0000-4000-8000-0000000003e1', 'editor-eventos@teste.invalid'),
  ('00000000-0000-4000-8000-0000000003a1', 'admin-eventos@teste.invalid'),
  ('00000000-0000-4000-8000-0000000003b1', 'superadmin-eventos@teste.invalid');
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-0000000003f1';
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-0000000003e1';
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000003a1';
update public.profiles set role = 'super_admin' where id = '00000000-0000-4000-8000-0000000003b1';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000003f1';
select throws_ok($$select public.record_audit_event('content.published', 'content')$$, '42501',
  'Seu papel não pode registrar este evento de auditoria.', 'viewer não pode forjar publicação');
select throws_ok($$select public.record_audit_event('media.uploaded', 'media')$$, '42501',
  'Seu papel não pode registrar este evento de auditoria.', 'viewer não pode registrar upload');
select throws_ok($$select public.record_audit_event('lead.viewed', 'lead')$$, '42501',
  'Seu papel não pode registrar este evento de auditoria.', 'viewer não pode registrar acesso a lead');
select lives_ok($$select public.record_audit_event('auth.logout', 'session')$$,
  'viewer pode registrar evento da própria sessão');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000003e1';
select lives_ok($$select public.record_audit_event('content.published', 'content')$$,
  'editor pode registrar publicação');
select throws_ok($$select public.record_audit_event('settings.updated', 'settings')$$, '42501',
  'Seu papel não pode registrar este evento de auditoria.', 'editor não pode registrar alteração administrativa');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000003a1';
select lives_ok($$select public.record_audit_event('lead.viewed', 'lead')$$,
  'admin pode registrar evento de lead');
select lives_ok($$select public.record_audit_event('settings.updated', 'settings')$$,
  'admin pode registrar alteração de configurações');
select throws_ok($$select public.record_audit_event('user.unknown', 'user')$$, '42501',
  'Evento de auditoria desconhecido.', 'evento fora do catálogo é recusado');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000003b1';
select throws_ok($$select public.record_audit_event('lead.viewed', 'lead')$$, '42501',
  'Seu papel não pode registrar este evento de auditoria.', 'super_admin não ganha acesso a eventos com dados pessoais');
select lives_ok($$select public.record_audit_event('settings.updated', 'settings')$$,
  'super_admin pode registrar alterações de configurações');
reset role;

select * from finish();
rollback;
