/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000100_audit_event_authorization.sql
 Descrição    : Restringe a gravação de eventos de auditoria pelo papel autenticado.

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
 28/10/2026 Vinícius Nishimura Reis  Autoriza eventos conforme papel (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- O RPC é SECURITY DEFINER, portanto aplica autorização explicitamente antes de inserir.
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
declare
  v_role public.app_role;
  v_allowed boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão obrigatória para auditoria.' using errcode = '42501';
  end if;

  v_role := public.current_app_role();
  v_allowed := case
    when p_event like 'content.%' or p_event like 'media.%'
      then v_role in ('editor', 'admin', 'super_admin')
    when p_event like 'lead.%' or p_event like 'feedback.%'
      or p_event like 'retention.%' or p_event like 'settings.%' or p_event like 'user.%'
      then v_role in ('admin', 'super_admin')
    when p_event like 'auth.%' or p_event = 'access.denied'
      then true
    else false
  end;

  if not v_allowed then
    raise exception 'Papel insuficiente para registrar este evento.' using errcode = '42501';
  end if;

  insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, outcome, metadata, request_id)
  values ((select auth.uid()), v_role, p_event, p_resource_type, p_resource_id,
          p_outcome, coalesce(p_metadata, '{}'::jsonb), p_request_id);
end;
$$;
