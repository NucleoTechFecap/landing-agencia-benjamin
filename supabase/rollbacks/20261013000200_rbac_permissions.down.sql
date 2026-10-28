/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000200_rbac_permissions.down.sql
 Descrição    : Reversão da matriz RBAC, das funções de papel e das políticas do bucket de mídia.

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

-- Reverte 20261013000200_rbac_permissions.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql), em ordem inversa das migrations e só depois de backup
-- (GO-01). Em seguida, registrar no histórico:
--   npx supabase migration repair --status reverted 20261013000200
--
-- As linhas de role_permissions são estrutura (vêm da própria migration) e saem sem aviso.
-- Arquivos no bucket "media" interrompem a reversão; para seguir mesmo assim, rode antes, na
-- mesma sessão: set benjamin.confirmar_rollback = 'sim';
--
-- O bucket "media" fica: o Storage não deixa apagar bucket por SQL. Se for preciso removê-lo,
-- use o painel ou a API do Storage depois de esvaziá-lo. Reaplicar a 0200 o reaproveita
-- (on conflict do nothing).

begin;

do $$
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if exists (select 1 from storage.objects where bucket_id = 'media') then
    raise exception 'O bucket media tem arquivos. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';';
  end if;
end;
$$;

drop policy if exists "media: exclusão por quem pode excluir mídia" on storage.objects;
drop policy if exists "media: substituição por quem pode editar mídia" on storage.objects;
drop policy if exists "media: upload por quem pode criar mídia" on storage.objects;
drop policy if exists "media: leitura pública" on storage.objects;

drop policy if exists "profiles: gestores leem todos" on public.profiles;

drop function if exists public.set_profile_active(uuid, boolean);
drop function if exists public.assign_role(uuid, public.app_role);
drop function if exists public.has_permission(text, text);
drop table if exists public.role_permissions;

commit;
