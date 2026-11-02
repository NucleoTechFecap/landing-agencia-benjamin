/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000100_arc11_ambiente_banco.down.sql
 Descrição    : Reversão da marcação de banco de produção (ARC-11).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261102000100_arc11_ambiente_banco.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261102000100
--
-- Sem a tabela, o seed deixa de recusar este banco. Se ele estiver marcado como produção, a
-- reversão é interrompida; para seguir de propósito, rode antes, na mesma sessão:
--   set benjamin.confirmar_rollback = 'sim';

begin;

do $$
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if to_regclass('public.ambiente_banco') is not null then
    if exists (select 1 from public.ambiente_banco) then
      raise exception 'Este banco está marcado como produção. Confirme com: set benjamin.confirmar_rollback = ''sim'';';
    end if;
  end if;
end;
$$;

drop table if exists public.ambiente_banco;

commit;
