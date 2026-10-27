/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261027000100_audit_log_anonimiza_ator.sql
 Descrição    : Permite excluir conta que tem eventos auditados, anonimizando o ator sem abrir a trilha a alterações.

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

-- `audit_log.actor_id` referencia `auth.users` com `on delete set null`, mas o gatilho
-- append-only barrava esse UPDATE: qualquer conta com um evento auditado (até um login)
-- não podia ser excluída ("Database error deleting user").
--
-- A única alteração liberada é a anonimização feita pela própria chave estrangeira:
-- `actor_id` passa a nulo e todo o resto da linha fica igual. A cascata chega aqui com
-- pg_trigger_depth() = 2 (o gatilho interno da FK dispara este); um UPDATE direto,
-- mesmo do service_role, chega com 1 e continua recusado, assim como qualquer DELETE.
create or replace function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and pg_trigger_depth() > 1
     and old.actor_id is not null
     and new.actor_id is null
     and (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') then
    return new;
  end if;
  raise exception 'audit_log é somente inclusão.' using errcode = '42501';
end;
$$;

comment on column public.audit_log.actor_id is
  'Quem fez a ação. Fica nulo quando a conta é excluída; o papel (actor_role) e o evento permanecem.';
