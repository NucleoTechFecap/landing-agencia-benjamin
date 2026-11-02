/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000100_arc11_ambiente_banco.sql
 Descrição    : Marcação de banco de produção, consultada pelo seed de desenvolvimento antes de inserir.

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

-- Trava do seed (ARC-11). A primeira versão usava `alter database ... set app.ambiente`, mas no
-- Supabase o papel postgres não é superusuário e o Postgres recusa gravar parâmetro customizado
-- (42501). Esta tabela vale o mesmo, é versionada e acompanha os dumps: uma cópia de produção
-- restaurada em outro lugar continua recusando o seed.
--
-- A migration não marca nada, porque roda igual em todo banco. A marcação é feita uma vez, à mão,
-- no banco de produção (docs/operacao/provisionamento-producao.md):
--   insert into public.ambiente_banco (ambiente) values ('producao');

-- Só existe um valor possível, e a PK garante no máximo uma linha.
create table public.ambiente_banco (
  ambiente text primary key check (ambiente = 'producao'),
  created_at timestamptz not null default now()
);

comment on table public.ambiente_banco is 'Com uma linha, o banco é de produção: supabase/seed.sql recusa rodar. Não é lida pela aplicação.';

-- Nenhum acesso pela API: só o papel postgres (SQL Editor, migrations, seed) lê e grava.
revoke all on table public.ambiente_banco from anon, authenticated;
alter table public.ambiente_banco enable row level security;
