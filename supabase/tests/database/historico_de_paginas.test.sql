/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : historico_de_paginas.test.sql
 Descrição    : RLS, histórico e restauração de páginas.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Testa histórico de páginas (FUT-04).
════════════════════════════════════════════════════════════════════════════════
*/
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);
insert into auth.users (id,email) values
 ('00000000-0000-4000-8000-000000009201','historico-editor@teste.invalid'),
 ('00000000-0000-4000-8000-000000009202','historico-viewer@teste.invalid');
update public.profiles set role='editor' where id='00000000-0000-4000-8000-000000009201';
update public.profiles set role='viewer' where id='00000000-0000-4000-8000-000000009202';
insert into public.pages(id,slug,title,is_custom) values
 ('00000000-0000-4000-8000-000000009203','pagina-historico-teste','Título original',true);
insert into public.blocks(page_id,type,content) values
 ('00000000-0000-4000-8000-000000009203','rich-text','{"paragraphs":["Texto original"]}');
select is((select count(*)::int from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),1,'mudanças na mesma transação geram uma versão');
select is((select snapshot->'blocks'->0->'content'->'paragraphs'->>0 from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),'Texto original','versão contém os blocos finais');
-- Teste pgTAP roda numa transação: preserva uma cópia com outro transaction_id para simular uma versão anterior.
insert into public.page_versions(page_id,transaction_id,snapshot)
  select page_id,txid_current()+1,snapshot from public.page_versions where page_id='00000000-0000-4000-8000-000000009203';
update public.pages set title='Título alterado' where id='00000000-0000-4000-8000-000000009203';
update public.blocks set content='{"paragraphs":["Texto novo"]}' where page_id='00000000-0000-4000-8000-000000009203';
set local role anon;
select throws_ok($$select * from public.page_versions$$,'42501',null,'visitante não lê versões');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000009202';
select is((select count(*)::int from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),2,'leitor vê versões');
select throws_ok($$insert into public.page_versions(page_id,snapshot) values ('00000000-0000-4000-8000-000000009203','{}')$$,'42501',null,'leitor não escreve versões');
select throws_ok($$select public.restore_page_version('00000000-0000-4000-8000-000000009203',(select max(id) from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),(select updated_at from public.pages where id='00000000-0000-4000-8000-000000009203'))$$,'42501',null,'leitor não restaura');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000009201';
select throws_ok($$select public.restore_page_version('00000000-0000-4000-8000-000000009203',(select max(id) from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),'2000-01-01')$$,'BJ002',null,'rejeita edição com versão desatualizada');
select lives_ok($$select public.restore_page_version('00000000-0000-4000-8000-000000009203',(select max(id) from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),(select updated_at from public.pages where id='00000000-0000-4000-8000-000000009203'))$$,'editor restaura versão anterior');
select is((select title from public.pages where id='00000000-0000-4000-8000-000000009203'),'Título original','restaura título');
select is((select content->'paragraphs'->>0 from public.blocks where page_id='00000000-0000-4000-8000-000000009203'),'Texto original','restaura blocos');
select is((select slug from public.pages where id='00000000-0000-4000-8000-000000009203'),'pagina-historico-teste','mantém endereço atual');
select is((select count(*)::int from public.audit_log where resource_id='00000000-0000-4000-8000-000000009203' and metadata->>'reason'='versao-restaurada'),0,'editor não lê a auditoria restrita');
reset role;
select is((select count(*)::int from public.audit_log where resource_id='00000000-0000-4000-8000-000000009203' and metadata->>'reason'='versao-restaurada'),1,'restauração é auditada na mesma transação');
update public.pages set status='published',published_at=now() where id='00000000-0000-4000-8000-000000009203';
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000009201';
select lives_ok($$select public.restore_page_version('00000000-0000-4000-8000-000000009203',(select max(id) from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),(select updated_at from public.pages where id='00000000-0000-4000-8000-000000009203'))$$,'editor pode restaurar página publicada');
select is((select status::text from public.pages where id='00000000-0000-4000-8000-000000009203'),'draft','restauração tira página do ar para revisão');
reset role;
insert into public.page_versions(page_id,transaction_id,snapshot)
  select page_id,txid_current()+2,jsonb_set(snapshot,'{blocks,0,type}','"tipo-invalido"')
  from public.page_versions where page_id='00000000-0000-4000-8000-000000009203' and transaction_id=txid_current()+1;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000009201';
select throws_ok($$select public.restore_page_version('00000000-0000-4000-8000-000000009203',(select max(id) from public.page_versions where page_id='00000000-0000-4000-8000-000000009203'),(select updated_at from public.pages where id='00000000-0000-4000-8000-000000009203'))$$,'23514',null,'bloco inválido impede restauração');
select is((select content->'paragraphs'->>0 from public.blocks where page_id='00000000-0000-4000-8000-000000009203'),'Texto original','falha não altera conteúdo existente');
reset role;
select * from finish();
rollback;
