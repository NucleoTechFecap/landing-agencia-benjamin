/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : blog.test.sql
 Descrição    : Testes de segurança e estados dos artigos do blog.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Testes do blog (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001a01', 'blog-editor@teste.invalid'),
  ('00000000-0000-4000-8000-000000001a02', 'blog-viewer@teste.invalid');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-000000001a01';
update public.profiles set role = 'viewer' where id = '00000000-0000-4000-8000-000000001a02';
insert into public.blog_articles (slug, title, summary, author, paragraphs, status, published_at) values
  ('blog-publicado-teste', 'Artigo publicado', 'Um resumo de artigo que tem mais de trinta caracteres.', 'Equipe', array['Parágrafo'], 'published', now() - interval '1 day'),
  ('blog-futuro-teste', 'Artigo futuro', 'Um resumo de artigo que tem mais de trinta caracteres.', 'Equipe', array['Parágrafo'], 'published', now() + interval '1 day');
insert into public.blog_articles (slug, title) values ('blog-rascunho-teste', 'Artigo rascunho');
insert into public.media_assets(id, path, mime_type, alt_text) values
  ('00000000-0000-4000-8000-000000001a03', 'blog/teste.webp', 'image/webp', 'Capa de teste');
create function pg_temp.deleted_count() returns integer language plpgsql as $$
declare n integer;
begin
  delete from public.blog_articles where slug = 'blog-novo-teste';
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function pg_temp.deleted_count() to authenticated;
set local role anon;
select is((select count(*)::int from public.blog_articles where slug like 'blog-%-teste'), 1, 'anon só lê publicação com data alcançada');
select is((select count(*)::int from public.media_assets where id='00000000-0000-4000-8000-000000001a03'), 0, 'anon não lê mídia sem uso público');
select throws_ok($$insert into public.blog_articles (slug,title) values ('blog-anonimo','Inválido')$$, '42501', null, 'anon não cria artigo');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000001a02';
select is((select count(*)::int from public.blog_articles where slug like 'blog-%-teste'), 3, 'viewer lê rascunhos no painel');
select throws_ok($$insert into public.blog_articles (slug,title) values ('blog-viewer','Inválido')$$, '42501', null, 'viewer não cria artigo');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000001a01';
select lives_ok($$insert into public.blog_articles (slug,title) values ('blog-novo-teste','Novo artigo')$$, 'editor cria rascunho');
select throws_ok($$update public.blog_articles set status='published', published_at=now() where slug='blog-novo-teste'$$, '23514', null, 'não publica artigo incompleto');
select throws_ok($$update public.blog_articles set paragraphs=array[''] where slug='blog-novo-teste'$$, '23514', null, 'rejeita parágrafo vazio');
select lives_ok($$update public.blog_articles set summary='Um resumo de artigo que tem mais de trinta caracteres.', author='Equipe', paragraphs=array['Texto'], status='published', published_at=now() where slug='blog-novo-teste'$$, 'editor publica artigo completo');
select lives_ok($$update public.blog_articles set cover_media_id='00000000-0000-4000-8000-000000001a03' where slug='blog-novo-teste'$$, 'editor escolhe capa com texto alternativo');
select throws_ok($$update public.media_assets set alt_text=null where id='00000000-0000-4000-8000-000000001a03'$$, 'BJ003', null, 'não remove o texto alternativo de capa publicada');
reset role;
set local role anon;
select is((select count(*)::int from public.media_assets where id='00000000-0000-4000-8000-000000001a03'), 1, 'anon lê metadados da capa publicada');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000001a01';
select throws_ok($$update public.blog_articles set slug='outro-endereco' where slug='blog-novo-teste'$$, 'BJ001', null, 'slug permanece fixo após publicar');
select lives_ok($$update public.blog_articles set status='archived', archived_at=now() where slug='blog-novo-teste'$$, 'editor arquiva artigo publicado');
select is(pg_temp.deleted_count(), 0, 'artigo publicado não é excluído nem libera o slug');
reset role;
select * from finish();
rollback;
