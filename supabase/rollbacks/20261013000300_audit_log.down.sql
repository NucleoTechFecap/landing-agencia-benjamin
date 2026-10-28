/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000300_audit_log.down.sql
 Descrição    : Reversão da trilha de auditoria e das versões auditadas de assign_role/set_profile_active.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261013000300_audit_log.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql), em ordem inversa das migrations e só depois de backup
-- (GO-01). Em seguida, registrar no histórico:
--   npx supabase migration repair --status reverted 20261013000300
--
-- Com eventos gravados, a reversão é interrompida (a trilha é a evidência de quem fez o quê).
-- Para descartá-la de propósito, rode antes, na mesma sessão:
-- set benjamin.confirmar_rollback = 'sim';

begin;

do $$
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if to_regclass('public.audit_log') is not null and exists (select 1 from public.audit_log) then
    raise exception 'public.audit_log tem eventos. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';';
  end if;
end;
$$;

-- O trigger append-only sai junto com a tabela.
drop table if exists public.audit_log;
drop function if exists public.record_audit_event(text, text, text, text, jsonb, text);
drop function if exists public.audit_log_append_only();

-- assign_role e set_profile_active voltam à versão da 0200 (sem auditoria e sem a trava do
-- último super_admin). "create or replace" mantém os privilégios atuais das funções.
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

  if v_actor_role = 'super_admin'
     or (v_actor_role = 'admin'
         and v_target_role in ('editor', 'viewer', 'pending')
         and p_role in ('editor', 'viewer', 'pending')) then
    update public.profiles set role = p_role where id = p_target;
  else
    raise exception 'Seu papel não permite esta atribuição.' using errcode = '42501';
  end if;
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
  if v_actor_role = 'super_admin'
     or (v_actor_role = 'admin' and v_target_role in ('editor', 'viewer', 'pending')) then
    update public.profiles set active = p_active where id = p_target;
  else
    raise exception 'Seu papel não permite esta operação.' using errcode = '42501';
  end if;
end;
$$;

commit;
