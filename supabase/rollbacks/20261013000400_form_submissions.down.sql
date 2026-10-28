/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000400_form_submissions.down.sql
 Descrição    : Reversão da tabela de envios dos formulários públicos.

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

-- Reverte 20261013000400_form_submissions.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql), em ordem inversa das migrations e só depois de backup
-- (GO-01). Em seguida, registrar no histórico:
--   npx supabase migration repair --status reverted 20261013000400
--
-- A tabela guarda dados pessoais (TECH-08): com envios gravados, a reversão é interrompida.
-- Para descartá-los de propósito, rode antes, na mesma sessão:
-- set benjamin.confirmar_rollback = 'sim';

begin;

do $$
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if to_regclass('public.form_submissions') is not null
     and exists (select 1 from public.form_submissions) then
    raise exception 'public.form_submissions tem envios. Faça backup e confirme com: set benjamin.confirmar_rollback = ''sim'';';
  end if;
end;
$$;

-- Índices, políticas e o trigger saem junto com a tabela. touch_updated_at() é da 0100.
drop table if exists public.form_submissions;

commit;
