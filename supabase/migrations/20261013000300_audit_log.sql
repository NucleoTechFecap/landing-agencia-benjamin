/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000300_audit_log.sql
 Descrição    : Trilha de auditoria append-only, função de registro e auditoria de papéis.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-10).
──────────────────────────────────────────────────────────────────────────────
*/

-- Trilha de auditoria append-only (TECH-10).
-- Registra QUEM fez O QUÊ, QUANDO e EM QUAL recurso — nunca conteúdo de formulários,
-- senhas, tokens ou dados pessoais (metadados filtrados por lista permitida no código).

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_role public.app_role,
  event text not null check (event in (
    'auth.login.succeeded', 'auth.logout', 'auth.password.changed', 'user.invited', 'user.role_changed',
    'user.activation_changed', 'content.created', 'content.updated', 'content.published', 'content.unpublished',
    'content.archived', 'content.restored', 'content.deleted', 'settings.updated', 'media.uploaded',
    'media.deleted', 'lead.viewed', 'lead.status_changed', 'lead.exported', 'lead.deleted', 'feedback.viewed',
    'feedback.deleted', 'retention.executed', 'access.denied'
  )),
  resource_type text not null,
  resource_id text,
  outcome text not null default 'success' check (outcome in ('success', 'denied', 'failure')),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 2048),
  request_id text
);

create index audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, occurred_at desc);
create index audit_log_resource_idx on public.audit_log (resource_type, resource_id);

comment on table public.audit_log is 'Auditoria append-only. Sem PII; leitura restrita a audit:view.';

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- Leitura somente por quem tem audit:view (super_admin, admin). Leitura anônima: nunca.
create policy "audit_log: leitura restrita"
  on public.audit_log for select to authenticated
  using (public.has_permission('audit', 'view'));

-- Append-only: nem service_role altera ou apaga eventos sem desativar o trigger.
create function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log é somente inclusão.' using errcode = '42501';
end;
$$;

create trigger audit_log_no_update_delete
  before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();

-- Gravação controlada: ator, papel e horário vêm da sessão, não do cliente.
create function public.record_audit_event(
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

revoke execute on function public.record_audit_event(text, text, text, text, jsonb, text) from anon;

-- Alterações de papel/ativação passam a ser auditadas na MESMA transação e não podem
-- remover o último super_admin ativo (limite de operação crítica).
create or replace function public.assign_role(p_target uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.app_role := public.current_app_role();
  v_target_role public.app_role;
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão obrigatória.' using errcode = '42501';
  end if;
  if p_target = (select auth.uid()) then
    raise exception 'Não é permitido alterar o próprio papel.' using errcode = '42501';
  end if;

  select role into v_target_role from public.profiles where id = p_target;
  if v_target_role is null then
    raise exception 'Perfil não encontrado.' using errcode = 'P0002';
  end if;

  if not (v_actor_role = 'super_admin'
          or (v_actor_role = 'admin'
              and v_target_role in ('editor', 'viewer', 'pending')
              and p_role in ('editor', 'viewer', 'pending'))) then
    insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, outcome, metadata)
    values ((select auth.uid()), v_actor_role, 'user.role_changed', 'user', p_target::text, 'denied',
            jsonb_build_object('fromRole', v_target_role, 'toRole', p_role));
    raise exception 'Seu papel não permite esta atribuição.' using errcode = '42501';
  end if;

  if v_target_role = 'super_admin' and p_role <> 'super_admin'
     and (select count(*) from public.profiles where role = 'super_admin' and active) <= 1 then
    raise exception 'Mantenha ao menos um super_admin ativo.' using errcode = '42501';
  end if;

  update public.profiles set role = p_role where id = p_target;
  insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, metadata)
  values ((select auth.uid()), v_actor_role, 'user.role_changed', 'user', p_target::text,
          jsonb_build_object('fromRole', v_target_role, 'toRole', p_role));
end;
$$;

create or replace function public.set_profile_active(p_target uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.app_role := public.current_app_role();
  v_target_role public.app_role;
begin
  if (select auth.uid()) is null or p_target = (select auth.uid()) then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;
  select role into v_target_role from public.profiles where id = p_target;
  if not (v_actor_role = 'super_admin'
          or (v_actor_role = 'admin' and v_target_role in ('editor', 'viewer', 'pending'))) then
    raise exception 'Seu papel não permite esta operação.' using errcode = '42501';
  end if;
  if v_target_role = 'super_admin' and not p_active
     and (select count(*) from public.profiles where role = 'super_admin' and active) <= 1 then
    raise exception 'Mantenha ao menos um super_admin ativo.' using errcode = '42501';
  end if;

  update public.profiles set active = p_active where id = p_target;
  insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, metadata)
  values ((select auth.uid()), v_actor_role, 'user.activation_changed', 'user', p_target::text,
          jsonb_build_object('active', p_active));
end;
$$;
