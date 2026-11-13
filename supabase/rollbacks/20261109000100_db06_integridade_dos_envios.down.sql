/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261109000100_db06_integridade_dos_envios.down.sql
 Descrição    : Reverte as restrições de forma dos envios de formulário.

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

-- Reverte 20261109000100_db06_integridade_dos_envios.sql. O Supabase CLI não executa reversões:
-- aplicar manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261109000100
--
-- Não apaga dados: só remove as restrições, e a validação da aplicação continua valendo.
-- Pode rodar de novo sem erro, inclusive depois de a tabela já ter sido removida.

begin;

alter table if exists public.form_submissions
  drop constraint if exists form_submissions_payload_object,
  drop constraint if exists form_submissions_payload_size,
  drop constraint if exists form_submissions_category_format,
  drop constraint if exists form_submissions_protocol_format,
  drop constraint if exists form_submissions_source_path_format,
  drop constraint if exists form_submissions_notification_attempts,
  drop constraint if exists form_submissions_notification_error_length;

commit;
