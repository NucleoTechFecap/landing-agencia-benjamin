/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : paginas_personalizadas.test.sql
 Descrição    : Visibilidade e integridade de páginas próprias.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Testa páginas personalizadas.
════════════════════════════════════════════════════════════════════════════════
*/
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);
insert into public.pages (id, slug, title) values
 ('00000000-0000-4000-8000-000000009101','pagina-antiga-sem-rota','Página antiga');
insert into public.pages (id, slug, title, is_custom) values
 ('00000000-0000-4000-8000-000000009102','pagina-personalizada-teste','Página própria',true);
insert into public.media_assets (id,path,mime_type,alt_text) values
 ('00000000-0000-4000-8000-000000009103','/brand/teste.webp','image/webp','Imagem de teste');
select lives_ok($$insert into public.blocks (page_id,type,content) values
  ('00000000-0000-4000-8000-000000009102','image', '{"image":{"id":"00000000-0000-4000-8000-000000009103","src":"/brand/teste.webp","alt":"Imagem de teste"}}')$$, 'aceita bloco com mídia válida');
select throws_ok($$insert into public.blocks (page_id,type,content) values
  ('00000000-0000-4000-8000-000000009102','image', '{"image":{"id":"00000000-0000-4000-8000-000000009104","src":"/brand/teste.webp","alt":"Imagem de teste"}}')$$, '23514', null, 'recusa mídia inexistente');
select throws_ok($$insert into public.blocks (page_id,type,content) values
  ('00000000-0000-4000-8000-000000009102','image', '{"image":{"id":"00000000-0000-4000-8000-000000009103","alt":"Imagem de teste"}}')$$, '23514', null, 'recusa imagem sem endereço');
select throws_ok($$delete from public.media_assets where id='00000000-0000-4000-8000-000000009103'$$, '23503', null, 'não exclui mídia em uso');
select throws_ok($$update public.media_assets set alt_text=null where id='00000000-0000-4000-8000-000000009103'$$, 'BJ003', null, 'não remove texto alternativo da mídia em uso');
select is((select is_custom from public.pages where id='00000000-0000-4000-8000-000000009101'), false, 'página anterior não se torna personalizada');
select throws_ok($$update public.pages set is_custom=true where id='00000000-0000-4000-8000-000000009101'$$, 'BJ001', null, 'tipo da página é imutável');
select throws_ok($$update public.pages set slug='sobre' where id='00000000-0000-4000-8000-000000009102'$$, '23514', null, 'página própria não ocupa slug institucional');
set local role anon;
select is((select count(*)::int from public.pages where id='00000000-0000-4000-8000-000000009102'),0,'visitante não lê rascunho');
reset role;
select lives_ok($$update public.pages set status='published', published_at=now() where id='00000000-0000-4000-8000-000000009102'$$,'página própria pode ser publicada');
set local role anon;
select is((select count(*)::int from public.pages where id='00000000-0000-4000-8000-000000009102'),1,'visitante lê página publicada');
reset role;
select throws_ok($$delete from public.pages where id='00000000-0000-4000-8000-000000009102'$$,'BJ001',null,'página publicada não pode liberar o endereço');
select * from finish();
rollback;
