/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000100_auth_profiles.down.sql
 Descrição    : Reversão dos papéis, perfis administrativos e do trigger de perfil pendente.

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

-- Reverte 20261013000100_auth_profiles.sql, a primeira migration: depois dela o schema public
-- fica sem nada do projeto. O Supabase CLI não executa reversões: aplicar manualmente (SQL
-- Editor ou psql), por último e só depois de backup (GO-01). Em seguida, registrar:
--   npx supabase migration repair --status reverted 20261013000100
--
-- As contas de auth.users não são apagadas, só os perfis (papel e status). Com perfis
-- cadastrados, a reversão é interrompida; para descartá-los de propósito, rode antes, na
-- mesma sessão: set benjamin.confirmar_rollback = 'sim';

begin;

do $$
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if to_regclass('public.profiles') is not null and exists (select 1 from public.profiles) then
    raise exception 'public.profiles tem perfis. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';';
  end if;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.profiles;
drop function if exists public.current_app_role();
drop function if exists public.handle_new_user();
drop function if exists public.touch_updated_at();
drop type if exists public.app_role;

commit;
