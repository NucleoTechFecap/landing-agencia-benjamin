/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000100_audit_event_authorization.down.sql
 Descrição    : Reverte a autorização por papel em record_audit_event.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinícius Nishimura Reis  Restaura a verificação anterior (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261028000100_audit_event_authorization.sql. Aplicação manual conforme o fluxo do projeto.
create or replace function public.record_audit_event(
  p_event text,
  p_resource_type text,
  p_resource_id text default null,
  p_outcome text default 'success',
  p_metadata jsonb default '{}'::jsonb,
  p_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão obrigatória para auditoria.' using errcode = '42501';
  end if;
  insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, outcome, metadata, request_id)
  values ((select auth.uid()), public.current_app_role(), p_event, p_resource_type, p_resource_id,
          p_outcome, coalesce(p_metadata, '{}'::jsonb), p_request_id);
end;
$$;
