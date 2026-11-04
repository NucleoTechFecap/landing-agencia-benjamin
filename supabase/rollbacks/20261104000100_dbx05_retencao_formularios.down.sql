/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261104000100_dbx05_retencao_formularios.down.sql
 Descrição    : Reversão das colunas e funções de retenção de form_submissions (DBX-05).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinicius Binda             Criação inicial (DBX-05).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261104000100_dbx05_retencao_formularios.sql. O Supabase CLI não executa reversões:
-- aplicar manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261104000100
--
-- Apaga as datas de andamento e as marcações de retenção suspensa. Anonimização e exclusão já feitas
-- não voltam. Se houver envio com retenção suspensa, a reversão é interrompida; para seguir de
-- propósito, rode antes, na mesma sessão:
--   set benjamin.confirmar_rollback = 'sim';

begin;

do $$
begin
  if coalesce(current_setting('benjamin.confirmar_rollback', true), '') = 'sim' then
    return;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'form_submissions' and column_name = 'legal_hold'
  ) then
    if exists (select 1 from public.form_submissions where legal_hold) then
      raise exception 'Há envios com retenção suspensa. Confirme com: set benjamin.confirmar_rollback = ''sim'';';
    end if;
  end if;
end;
$$;

drop trigger if exists form_submissions_protect_legal_hold on public.form_submissions;
drop trigger if exists form_submissions_touch_activity on public.form_submissions;

drop function if exists public.apply_retention(uuid[], uuid[], timestamptz, text);
drop function if exists public.retention_subjects();
drop function if exists public.protect_legal_hold();
drop function if exists public.touch_submission_activity();

alter table public.form_submissions
  drop column if exists anonymized_at,
  drop column if exists legal_hold,
  drop column if exists last_activity_at;

commit;
