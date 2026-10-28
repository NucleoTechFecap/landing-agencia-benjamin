/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261027000100_audit_log_anonimiza_ator.down.sql
 Descrição    : Reversão da anonimização do ator na exclusão de conta (volta ao append-only estrito).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 27/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 27/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261027000100_audit_log_anonimiza_ator.sql. O Supabase CLI não executa reversões:
-- aplicar manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261027000100
--
-- Efeito: contas com eventos auditados voltam a não poder ser excluídas. Eventos já
-- anonimizados continuam com actor_id nulo (não há como recuperar o vínculo).
create or replace function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log é somente inclusão.' using errcode = '42501';
end;
$$;

comment on column public.audit_log.actor_id is null;
