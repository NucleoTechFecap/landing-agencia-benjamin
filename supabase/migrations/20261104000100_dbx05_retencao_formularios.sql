/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261104000100_dbx05_retencao_formularios.sql
 Descrição    : Data do último andamento, retenção suspensa e aplicação da retenção em form_submissions.

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

-- Operação: docs/operacao/retencao-e-descarte.md. Os prazos ficam em lib/domain/forms/retention.ts e
-- dependem de aprovação (SEG-02): esta migration não exclui nada, e a rota recusa executar até lá.

-- updated_at não serve de "último andamento": muda a cada tentativa de notificação e adiaria o
-- descarte indefinidamente. Nos envios que já existem, é a melhor data disponível e só pode atrasar
-- o descarte, nunca antecipar.
alter table public.form_submissions
  add column last_activity_at timestamptz not null default now(),
  add column legal_hold boolean not null default false,
  add column anonymized_at timestamptz;

update public.form_submissions set last_activity_at = updated_at;

comment on column public.form_submissions.last_activity_at is 'Último andamento: criação ou mudança de status. Base dos prazos de retenção.';
comment on column public.form_submissions.legal_hold is 'Retenção suspensa (virou contrato, pedido judicial). Só muda por SQL de pessoa autorizada.';
comment on column public.form_submissions.anonymized_at is 'Quando o feedback identificado foi anonimizado.';

create function public.touch_submission_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.last_activity_at := now();
  return new;
end;
$$;

create trigger form_submissions_touch_activity
  before update on public.form_submissions
  for each row
  when (old.status is distinct from new.status)
  execute function public.touch_submission_activity();

-- Vale para todos os papéis: a suspensão só tem efeito se nada apagar a linha por outro caminho.
create function public.protect_legal_hold()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Este envio está com a retenção suspensa e não pode ser excluído.' using errcode = 'BJ004';
end;
$$;

create trigger form_submissions_protect_legal_hold
  before delete on public.form_submissions
  for each row
  when (old.legal_hold)
  execute function public.protect_legal_hold();

-- O que planRetention() precisa, sem o conteúdo do envio: nome, e-mail e mensagem não saem do banco.
create function public.retention_subjects()
returns table (id uuid, kind text, last_activity_at timestamptz, identified boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.kind, s.last_activity_at,
    s.kind = 'feedback' and coalesce(nullif(s.payload->>'name', ''), nullif(s.payload->>'email', '')) is not null
  from public.form_submissions s
  where not s.legal_hold;
$$;

comment on function public.retention_subjects() is
  'Envios sujeitos à retenção, sem dados pessoais. Fora os que têm retenção suspensa (DBX-05).';

-- Aplica um plano numa transação. Só conta o que mudou de verdade: retenção suspensa fica de fora e,
-- pelo p_planned_at, também o envio que teve andamento depois de o plano ser feito. Na auditoria,
-- só contagens (limite de 2 KB em metadata e nenhum vínculo com o titular).
create function public.apply_retention(
  p_delete uuid[],
  p_anonymize uuid[],
  p_planned_at timestamptz,
  p_origin text
)
returns table (deleted integer, anonymized integer, skipped integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
  v_anonymized integer;
begin
  if p_delete is null or p_anonymize is null or p_planned_at is null
     or p_origin is null or p_origin not in ('rotina', 'titular') then
    raise exception 'Parâmetros inválidos.' using errcode = '22023';
  end if;

  with changed as (
    delete from public.form_submissions s
    where s.id = any (p_delete) and not s.legal_hold and s.last_activity_at <= p_planned_at
    returning 1
  )
  select count(*) into v_deleted from changed;

  -- Mesmos campos de FEEDBACK_PERSONAL_FIELDS (conferido em content-sql.test.ts). Hash do IP e do
  -- conteúdo também saem: serviam para evitar abuso e ainda ligariam a linha a quem enviou.
  with changed as (
    update public.form_submissions s
    set payload = (s.payload - 'name' - 'email') || jsonb_build_object('allowContact', false),
        ip_hash = null,
        fingerprint = 'anonimizado',
        last_notification_error = null,
        anonymized_at = now()
    where s.id = any (p_anonymize) and s.kind = 'feedback' and not s.legal_hold
      and s.last_activity_at <= p_planned_at
    returning 1
  )
  select count(*) into v_anonymized from changed;

  deleted := v_deleted;
  anonymized := v_anonymized;
  skipped := cardinality(p_delete) + cardinality(p_anonymize) - v_deleted - v_anonymized;

  insert into public.audit_log (event, resource_type, outcome, metadata)
  values ('retention.executed', 'retention', 'success',
          jsonb_build_object('origin', p_origin, 'deleted', deleted, 'anonymized', anonymized, 'skipped', skipped));
  return next;
end;
$$;

comment on function public.apply_retention(uuid[], uuid[], timestamptz, text) is
  'Exclui e anonimiza envios numa transação e registra retention.executed só com contagens (DBX-05).';

-- Só o servidor e o SQL de pessoa autorizada: nada disso fica disponível pela sessão do painel.
revoke execute on function public.touch_submission_activity() from public, anon, authenticated, service_role;
revoke execute on function public.protect_legal_hold() from public, anon, authenticated, service_role;
revoke execute on function public.retention_subjects() from public, anon, authenticated;
revoke execute on function public.apply_retention(uuid[], uuid[], timestamptz, text) from public, anon, authenticated;
grant execute on function public.retention_subjects() to service_role;
grant execute on function public.apply_retention(uuid[], uuid[], timestamptz, text) to service_role;
