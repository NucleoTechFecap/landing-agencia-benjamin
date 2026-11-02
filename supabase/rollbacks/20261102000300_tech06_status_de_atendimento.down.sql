/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000300_tech06_status_de_atendimento.down.sql
 Descrição    : Reverte a restrição de update à coluna status em form_submissions.

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

-- Reverte 20261102000300_tech06_status_de_atendimento.sql. O Supabase CLI não executa reversões:
-- aplicar manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261102000300
--
-- Não apaga dados: só devolve o update da tabela inteira a authenticated (a RLS continua igual).
-- Pode rodar de novo sem erro.

begin;

grant update on public.form_submissions to authenticated;

commit;
