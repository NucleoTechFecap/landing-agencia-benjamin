/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : editor_do_site.test.sql
 Descrição    : Testes pgTAP do histórico de versões, da gravação da página inteira e das colunas do editor do site.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site, FUT-04).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Tudo roda numa transação desfeita no fim.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(27);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000002a1', 'admin-editor@teste.invalid'),
  ('00000000-0000-4000-8000-0000000002e1', 'editor-editor@teste.invalid'),
  ('00000000-0000-4000-8000-0000000002f1', 'leitor-editor@teste.invalid'),
  ('00000000-0000-4000-8000-0000000002a2', 'pendente-editor@teste.invalid');
update public.profiles set role = 'admin', full_name = 'Pessoa Admin' where id = '00000000-0000-4000-8000-0000000002a1';
update public.profiles set role = 'editor', full_name = 'Pessoa Editora' where id = '00000000-0000-4000-8000-0000000002e1';
update public.profiles set role = 'viewer', full_name = 'Pessoa Leitora' where id = '00000000-0000-4000-8000-0000000002f1';

insert into public.pages (id, slug, title, status, published_at) values
  ('00000000-0000-4000-8000-00000000bb01', 'pagina-do-historico', 'Página do histórico', 'published', now());
insert into public.blocks (page_id, type, content, sort_order) values
  ('00000000-0000-4000-8000-00000000bb01', 'rich-text', '{"paragraphs": ["Antes"]}', 0);

-- ─── Colunas novas ───────────────────────────────────────────────────────────

select has_column('public', 'pages', 'fields', 'pages tem fields');
select has_column('public', 'pages', 'seo', 'pages tem seo');
select has_column('public', 'services', 'seo', 'services tem seo');
select has_column('public', 'cases', 'seo', 'cases tem seo');
select has_column('public', 'site_settings', 'theme', 'site_settings tem theme');
select throws_ok(
  $$update public.pages set fields = '[]' where slug = 'pagina-do-historico'$$,
  '23514',
  null,
  'fields só aceita objeto'
);

-- Vale com ou sem a lista fechada da DBX-04 (blocks_type_catalog).
insert into public.pages (id, slug, title) values
  ('00000000-0000-4000-8000-00000000bb02', 'pagina-dos-blocos-novos', 'Página dos blocos novos');
select lives_ok(
  $$insert into public.blocks (page_id, type, content, sort_order)
    select '00000000-0000-4000-8000-00000000bb02', tipo, '{}', ordem::integer
    from unnest(array['hero', 'media-text', 'image', 'cards', 'gallery', 'faq', 'buttons'])
      with ordinality as novos(tipo, ordem)$$,
  'blocks aceita os tipos das páginas livres'
);

-- ─── Número, autor e imutabilidade ───────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000002e1","role":"authenticated"}', true);

insert into public.content_versions (entity, entity_id, version, action, status, label, snapshot, created_by, created_at)
values ('page', '00000000-0000-4000-8000-00000000bb01', 99, 'updated', 'published', 'Página',
        '{"title": "Um"}', '00000000-0000-4000-8000-0000000002a1', '2000-01-01');

select is(
  (select version from public.content_versions where entity_id = '00000000-0000-4000-8000-00000000bb01'),
  1,
  'o banco define o número da versão, não o painel'
);
select is(
  (select created_by from public.content_versions where entity_id = '00000000-0000-4000-8000-00000000bb01'),
  '00000000-0000-4000-8000-0000000002e1'::uuid,
  'o autor é a sessão: não dá para assinar por outra pessoa'
);
select isnt(
  (select created_at::date from public.content_versions where entity_id = '00000000-0000-4000-8000-00000000bb01'),
  '2000-01-01'::date,
  'o horário é o do banco'
);

insert into public.content_versions (entity, entity_id, version, action, status, snapshot)
values ('page', '00000000-0000-4000-8000-00000000bb01', 1, 'updated', 'published', '{"title": "Dois"}');
select is(
  (select max(version) from public.content_versions where entity_id = '00000000-0000-4000-8000-00000000bb01'),
  2,
  'a numeração segue por item'
);

select throws_ok(
  $$insert into public.content_versions (entity, entity_id, version, action, status)
    values ('page', 'x', 1, 'updated', 'published')$$,
  '23514',
  null,
  'edição precisa de conteúdo para poder voltar'
);
select lives_ok(
  $$insert into public.content_versions (entity, entity_id, version, action, status)
    values ('page', 'x', 1, 'published', 'published')$$,
  'mudança de estado não guarda conteúdo'
);

select throws_ok(
  $$update public.content_versions set label = 'forjado'$$,
  '42501',
  null,
  'versão não pode ser alterada'
);
select throws_ok(
  $$delete from public.content_versions$$,
  '42501',
  null,
  'versão não pode ser apagada'
);

-- O editor não mexe na aparência: quem responde por ela é settings:edit.
select throws_ok(
  $$insert into public.content_versions (entity, entity_id, version, action, snapshot)
    values ('theme', 'site', 1, 'updated', '{}')$$,
  '42501',
  null,
  'editor não registra versão da aparência'
);

-- ─── Leitura ─────────────────────────────────────────────────────────────────

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000002f1","role":"authenticated"}', true);
select isnt_empty(
  $$select 1 from public.content_versions where entity = 'page'$$,
  'leitor vê o histórico'
);
select throws_ok(
  $$insert into public.content_versions (entity, entity_id, version, action, snapshot)
    values ('page', 'y', 1, 'updated', '{}')$$,
  '42501',
  null,
  'leitor não grava versão'
);
select results_eq(
  $$select full_name from public.content_version_authors(array['00000000-0000-4000-8000-0000000002e1'::uuid])$$,
  $$values ('Pessoa Editora'::text)$$,
  'leitor vê o nome de quem alterou'
);
select is_empty(
  $$select full_name from public.content_version_authors(array['00000000-0000-4000-8000-0000000002a1'::uuid])$$,
  'nome de quem nunca alterou nada não sai por aqui'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000002a2","role":"authenticated"}', true);
select throws_ok(
  $$select * from public.content_version_authors(array['00000000-0000-4000-8000-0000000002e1'::uuid])$$,
  '42501',
  null,
  'conta sem acesso liberado não consulta nomes'
);
select is_empty($$select 1 from public.content_versions$$, 'conta sem acesso liberado não vê o histórico');

reset role;
set local role anon;
select throws_ok($$select 1 from public.content_versions$$, '42501', null, 'visitante não lê o histórico');
reset role;

-- ─── Página inteira numa transação ───────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000002e1","role":"authenticated"}', true);

select throws_ok(
  $$select public.save_page_document('00000000-0000-4000-8000-00000000bb01', '2000-01-01',
      '{"title": "Tarde", "description": null, "provisional": false, "fields": {}, "seo": {}}', '[]')$$,
  '40001',
  null,
  'versão desatualizada é recusada'
);
select throws_ok(
  format(
    $$select public.save_page_document('00000000-0000-4000-8000-00000000bb01', %L,
        '{"title": "Inteira", "description": null, "provisional": false, "fields": {}, "seo": {}, "status": "draft"}', '[]')$$,
    (select updated_at from public.pages where id = '00000000-0000-4000-8000-00000000bb01')
  ),
  '22023',
  null,
  'coluna fora da lista é recusada: restaurar não muda o estado'
);
select lives_ok(
  format(
    $$select public.save_page_document('00000000-0000-4000-8000-00000000bb01', %L,
        '{"title": "Inteira", "description": null, "provisional": false, "fields": {"values": {"a.b": "c"}, "hidden": []}, "seo": {"title": "SEO"}}',
        '[{"type": "rich-text", "content": {"paragraphs": ["Um"]}}, {"type": "cta", "content": {"title": "T", "label": "L", "href": "/contato"}}]')$$,
    (select updated_at from public.pages where id = '00000000-0000-4000-8000-00000000bb01')
  ),
  'grava dados e blocos'
);
select results_eq(
  $$select type, sort_order from public.blocks where page_id = '00000000-0000-4000-8000-00000000bb01' order by sort_order$$,
  $$values ('rich-text'::text, 0), ('cta'::text, 1)$$,
  'os blocos ficam na ordem da lista, no lugar dos antigos'
);

select * from finish();
rollback;
