/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000400_form_submissions.sql
 Descrição    : Tabela de leads, contatos e feedbacks com RLS por tipo de envio.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

-- Envios dos formulários públicos: leads, contatos e feedbacks (TECH-06/07/08).
-- Proposta entregue para DB-06/DB-07. A gravação é feita somente pelo servidor
-- (service_role) depois da validação, antispam e idempotência.

create table public.form_submissions (
  id uuid primary key,                          -- submissionId (chave de idempotência)
  protocol text not null,
  kind text not null check (kind in ('lead', 'contact', 'feedback')),
  category text not null,
  payload jsonb not null,                       -- dados validados (PII)
  fingerprint text not null,                    -- HMAC do conteúdo (dedupe 10 min)
  ip_hash text,                                 -- HMAC do IP (limite de envios)
  source_path text,
  status text not null default 'novo'
    check (status in ('novo', 'em_atendimento', 'respondido', 'lido', 'arquivado')),
  notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed', 'skipped')),
  notification_attempts integer not null default 0,
  last_notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index form_submissions_fingerprint_idx on public.form_submissions (fingerprint, created_at desc);
create index form_submissions_ip_idx on public.form_submissions (ip_hash, created_at desc);
create index form_submissions_kind_idx on public.form_submissions (kind, status, created_at desc);
create index form_submissions_backlog_idx on public.form_submissions (notification_status)
  where notification_status in ('pending', 'failed');

comment on table public.form_submissions is 'Leads, contatos e feedbacks. Dados pessoais: acesso restrito (TECH-08).';

alter table public.form_submissions enable row level security;
revoke all on public.form_submissions from anon, authenticated;
grant select, update, delete on public.form_submissions to authenticated;

-- Visitante (anon) não lê nem grava diretamente. No painel: leads/contatos exigem
-- lead:*, feedbacks exigem feedback:* (matriz RBAC — TECH-03).
create policy "form_submissions: leitura conforme tipo"
  on public.form_submissions for select to authenticated
  using (public.has_permission(case when kind = 'feedback' then 'feedback' else 'lead' end, 'view'));

create policy "form_submissions: status de atendimento"
  on public.form_submissions for update to authenticated
  using (public.has_permission(case when kind = 'feedback' then 'feedback' else 'lead' end, 'edit'));

create policy "form_submissions: exclusão (titular/retenção)"
  on public.form_submissions for delete to authenticated
  using (public.has_permission(case when kind = 'feedback' then 'feedback' else 'lead' end, 'delete'));

create trigger form_submissions_touch_updated_at
  before update on public.form_submissions
  for each row execute function public.touch_updated_at();
