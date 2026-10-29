/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000100_audit_event_role_guard.sql
 Descrição    : Restringe o registro de eventos de auditoria conforme o papel autenticado.

 Desenvolvedor: Codex

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Codex                     Restringe famílias de eventos por papel (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- A trilha é append-only, mas sem esta checagem qualquer conta autenticada poderia forjar
-- eventos de publicação, mídia ou dados administrativos.
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
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão obrigatória para auditoria.' using errcode = '42501';
  end if;

  if p_event is null or p_event not in (
    'auth.login.succeeded', 'auth.logout', 'auth.password.changed',
    'user.invited', 'user.role_changed', 'user.activation_changed',
    'content.created', 'content.updated', 'content.published', 'content.unpublished',
    'content.archived', 'content.restored', 'content.deleted', 'settings.updated',
    'media.uploaded', 'media.deleted', 'lead.viewed', 'lead.status_changed', 'lead.exported',
    'lead.deleted', 'feedback.viewed', 'feedback.deleted', 'retention.executed', 'access.denied'
  ) then
    raise exception 'Evento de auditoria desconhecido.' using errcode = '42501';
  end if;

  v_role := public.current_app_role();

  if p_event like 'content.%' or p_event like 'media.%' then
    if v_role not in ('super_admin', 'admin', 'editor') then
      raise exception 'Seu papel não pode registrar este evento de auditoria.' using errcode = '42501';
    end if;
  elsif p_event like 'lead.%' or p_event like 'feedback.%' or p_event like 'retention.%' then
    if v_role <> 'admin' then
      raise exception 'Seu papel não pode registrar este evento de auditoria.' using errcode = '42501';
    end if;
  elsif p_event like 'settings.%' or p_event like 'user.%' then
    if v_role not in ('super_admin', 'admin') then
      raise exception 'Seu papel não pode registrar este evento de auditoria.' using errcode = '42501';
    end if;
  end if;

  insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, outcome, metadata, request_id)
  values ((select auth.uid()), v_role, p_event, p_resource_type, p_resource_id, p_outcome,
          coalesce(p_metadata, '{}'::jsonb), p_request_id);
end;
$$;
