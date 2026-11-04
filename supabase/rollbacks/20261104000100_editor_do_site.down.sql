/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261104000100_editor_do_site.down.sql
 Descrição    : Reverte campos editáveis, SEO, aparência e histórico de versões.

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

-- Reverte 20261104000100_editor_do_site.sql. O Supabase CLI não executa reversões: aplicar manualmente
-- (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261104000100
--
-- Reverter o código ANTES: a versão atual do site lê estas colunas. APAGA o que foi editado nelas
-- (textos, SEO, aparência) e o histórico inteiro. Por isso para se houver conteúdo, a menos que a sessão
-- confirme com: set benjamin.confirmar_rollback = 'sim'; Pode rodar de novo sem erro.

begin;

do $$
begin
  -- Na segunda execução as colunas já não existem: a consulta só pode ser preparada se ainda houver o que reverter.
  if to_regclass('public.content_versions') is not null
     and coalesce(current_setting('benjamin.confirmar_rollback', true), '') <> 'sim' then
    if exists (select 1 from public.content_versions)
       or exists (select 1 from public.pages where fields <> '{}' or seo <> '{}')
       or exists (select 1 from public.site_settings where theme <> '{}') then
      raise exception 'Há textos, SEO, aparência ou histórico gravados. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';';
    end if;
  end if;
end;
$$;

-- `not valid`: a trilha é imutável, então eventos de restauração já gravados continuam lá.
alter table public.audit_log drop constraint if exists audit_log_event_check;
alter table public.audit_log add constraint audit_log_event_check check (event in (
  'auth.login.succeeded', 'auth.logout', 'auth.password.changed', 'user.invited', 'user.role_changed',
  'user.activation_changed', 'content.created', 'content.updated', 'content.published', 'content.unpublished',
  'content.archived', 'content.restored', 'content.deleted', 'settings.updated', 'media.uploaded',
  'media.deleted', 'lead.viewed', 'lead.status_changed', 'lead.exported', 'lead.deleted', 'feedback.viewed',
  'feedback.deleted', 'retention.executed', 'access.denied'
)) not valid;

-- Mesma função de 20261028000100.
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

drop function if exists public.save_page_document(uuid, timestamptz, jsonb, jsonb);
drop function if exists public.content_version_authors(uuid[]);
drop table if exists public.content_versions;
drop function if exists public.content_versions_before_insert();
drop function if exists public.content_version_resource(text);

alter table public.site_settings drop column if exists theme;
alter table public.cases drop column if exists seo;
alter table public.services drop column if exists seo;
alter table public.pages drop column if exists seo;
alter table public.pages drop column if exists fields;

commit;
