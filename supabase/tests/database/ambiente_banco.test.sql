/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : ambiente_banco.test.sql
 Descrição    : pgTAP da ARC-11: marcação de produção com uma linha só e sem acesso pela API.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

-- Executar com: npx supabase db reset && npx supabase test db
-- Que o seed recusa o banco marcado é testado em npm run test:migrations (etapa 2), que roda o
-- arquivo inteiro; aqui fica a tabela. Tudo roda numa transação desfeita no fim.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

select has_table('public', 'ambiente_banco', 'tabela da marcação existe');
select ok((select relrowsecurity from pg_class where oid = 'public.ambiente_banco'::regclass), 'ambiente_banco com RLS');
select is_empty($$select 1 from public.ambiente_banco$$, 'a migration não marca nenhum banco');

select throws_ok($$insert into public.ambiente_banco (ambiente) values ('local')$$, '23514', null,
  'só aceita o valor producao');
select lives_ok($$insert into public.ambiente_banco (ambiente) values ('producao')$$, 'o banco pode ser marcado');
select throws_ok($$insert into public.ambiente_banco (ambiente) values ('producao')$$, '23505', null,
  'no máximo uma linha');

set local role anon;
select throws_ok($$select * from public.ambiente_banco$$, '42501', null, 'anon não lê');
reset role;

set local role authenticated;
select throws_ok($$select * from public.ambiente_banco$$, '42501', null, 'authenticated não lê');
select throws_ok($$delete from public.ambiente_banco$$, '42501', null, 'authenticated não desfaz a marcação');
reset role;

select * from finish();
rollback;
