/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261104000200_editor_do_site.sql
 Descrição    : Campos editáveis, SEO e aparência do site e histórico de versões do conteúdo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site, FUT-04).
 04/11/2026 Vinícius Nishimura Reis  Nova versão (a 000100 é da DBX-05) e tipos de bloco na lista da DBX-04.
──────────────────────────────────────────────────────────────────────────────
*/

-- Editor do site. Quatro colunas jsonb e uma tabela nova, sem apagar nem reescrever dado existente:
-- com as colunas vazias, o site mostra exatamente o que já mostrava. O formato dos jsonb é validado
-- no código (lib/domain/content), como manifesto e about de site_settings.
--
-- Erros que o painel traduz (toCmsError): 42501 sem permissão, 40001 versão desatualizada,
-- P0002 item inexistente. Reversão: supabase/rollbacks/20261104000200_editor_do_site.down.sql.

-- ─── Campos, SEO e aparência ─────────────────────────────────────────────────

alter table public.pages
  add column fields jsonb not null default '{}' check (jsonb_typeof(fields) = 'object'),
  add column seo jsonb not null default '{}' check (jsonb_typeof(seo) = 'object');

comment on column public.pages.fields is
  'Textos, imagens, ícones e botões das seções fixas que divergem do padrão: {"values": {"secao.campo": ...}, "hidden": ["secao"]}.';
comment on column public.pages.seo is 'Título, descrição, palavras-chave, indexação e Open Graph da página.';

alter table public.services
  add column seo jsonb not null default '{}' check (jsonb_typeof(seo) = 'object');
alter table public.cases
  add column seo jsonb not null default '{}' check (jsonb_typeof(seo) = 'object');

alter table public.site_settings
  add column theme jsonb not null default '{}' check (jsonb_typeof(theme) = 'object');

comment on column public.site_settings.theme is
  'Cores, fontes, logotipos e imagem de compartilhamento que divergem da marca. Vazio = identidade padrão.';

-- ─── Histórico de versões (FUT-04, docs/roadmap/historico-de-versoes.md) ─────

-- Recurso da matriz RBAC que responde por cada tipo de versão.
create function public.content_version_resource(p_entity text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_entity in ('settings', 'theme') then 'settings' else p_entity end
$$;

create table public.content_versions (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('area', 'service', 'category', 'case', 'cta', 'page', 'settings', 'theme')),
  -- Sem FK: a versão sobrevive à exclusão do item. Configuração e aparência usam 'site'.
  entity_id text not null check (char_length(entity_id) between 1 and 64),
  version integer not null check (version > 0),
  action text not null check (action in (
    'baseline', 'created', 'updated', 'published', 'unpublished', 'archived', 'unarchived', 'deleted',
    'version_restored'
  )),
  status public.publish_status,
  -- Como o item se chamava naquele momento e o que mudou, para a linha do tempo.
  label text check (char_length(label) <= 200),
  summary text check (char_length(summary) <= 300),
  snapshot jsonb check (snapshot is null or jsonb_typeof(snapshot) = 'object'),
  restored_from integer check (restored_from is null or restored_from > 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (entity, entity_id, version),
  -- Só mudança de estado fica sem conteúdo: as demais precisam poder ser restauradas.
  constraint content_versions_snapshot check (
    snapshot is not null or action in ('published', 'unpublished', 'archived', 'unarchived', 'deleted')
  )
);

comment on table public.content_versions is
  'Versões imutáveis do conteúdo: quem alterou, quando e o que ficou gravado. Só o service role pode apagar (retenção e pedido de titular).';

-- A unique já cobre (entity, entity_id, version); este índice serve à linha do tempo geral.
create index content_versions_recent_idx on public.content_versions (created_at desc);
create index content_versions_author_idx on public.content_versions (created_by) where created_by is not null;

-- O banco define número, autor e horário: o painel não consegue forjar nenhum dos três.
create function public.content_versions_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('content_versions:' || new.entity || ':' || new.entity_id, 0));
  select coalesce(max(v.version), 0) + 1 into new.version
  from public.content_versions v
  where v.entity = new.entity and v.entity_id = new.entity_id;
  new.created_by := (select auth.uid());
  new.created_at := now();
  return new;
end;
$$;

create trigger content_versions_number before insert on public.content_versions
  for each row execute function public.content_versions_before_insert();

revoke all on table public.content_versions from anon, authenticated;
grant select, insert on table public.content_versions to authenticated;

alter table public.content_versions enable row level security;

create policy "content_versions: painel lê" on public.content_versions
  for select to authenticated
  using (public.has_permission(public.content_version_resource(entity), 'view'));

-- Sem política de update nem delete: a versão é imutável para quem usa o painel.
create policy "content_versions: registra quem altera" on public.content_versions
  for insert to authenticated
  with check (
    public.has_permission(public.content_version_resource(entity), 'edit')
    or public.has_permission(public.content_version_resource(entity), 'create')
    or public.has_permission(public.content_version_resource(entity), 'publish')
    or public.has_permission(public.content_version_resource(entity), 'archive')
    or public.has_permission(public.content_version_resource(entity), 'delete')
  );

-- Nome de quem alterou. `profiles` só mostra o próprio perfil a quem não gerencia usuários, e o
-- editor precisa ver quem mexeu no conteúdo: definer, restrito ao nome de quem já tem versão gravada.
create function public.content_version_authors(p_ids uuid[])
returns table (id uuid, full_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.has_permission('dashboard', 'view') then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;
  return query
    select p.id, p.full_name
    from public.profiles p
    where p.id = any (p_ids)
      and exists (select 1 from public.content_versions v where v.created_by = p.id);
end;
$$;

revoke execute on function public.content_version_authors(uuid[]) from public, anon;
grant execute on function public.content_version_authors(uuid[]) to authenticated;

-- Volta uma página inteira numa transação: dados, campos, SEO e blocos entram juntos ou não entram.
-- Não muda endereço nem estado. Security invoker: a RLS de páginas e blocos continua valendo.
create function public.save_page_document(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_values jsonb,
  p_blocks jsonb
)
returns table (id uuid, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c_columns constant text[] := array['title', 'description', 'provisional', 'fields', 'seo'];
  saved public.pages%rowtype;
  v_version timestamptz;
begin
  if jsonb_typeof(p_values) is distinct from 'object'
     or not p_values ?& c_columns
     or p_values - c_columns <> '{}'::jsonb
     or jsonb_typeof(p_blocks) is distinct from 'array'
     or p_id is null
     or p_expected_updated_at is null then
    raise exception 'Parâmetros inválidos.' using errcode = '22023';
  end if;
  if not public.has_permission('page', 'edit') then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;

  update public.pages p
  set title = p_values ->> 'title',
      description = p_values ->> 'description',
      provisional = (p_values ->> 'provisional')::boolean,
      fields = p_values -> 'fields',
      seo = p_values -> 'seo'
  where p.id = p_id and p.updated_at = p_expected_updated_at
  returning * into saved;
  if not found then
    select p.updated_at into v_version from public.pages p where p.id = p_id;
    if not found then
      raise exception 'Página não encontrada.' using errcode = 'P0002';
    elsif v_version = p_expected_updated_at then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    raise exception 'O conteúdo foi alterado por outra pessoa.' using errcode = '40001';
  end if;

  delete from public.blocks b where b.page_id = saved.id;
  insert into public.blocks (page_id, type, content, sort_order)
  select saved.id, b.value ->> 'type', b.value -> 'content', (b.ordinality - 1)::integer
  from jsonb_array_elements(p_blocks) with ordinality as b(value, ordinality);

  return query select saved.id, saved.updated_at;
end;
$$;

comment on function public.save_page_document(uuid, timestamptz, jsonb, jsonb) is
  'Grava página e blocos numa transação, para restaurar uma versão sem deixar a página pela metade.';

revoke execute on function public.save_page_document(uuid, timestamptz, jsonb, jsonb) from public, anon;
grant execute on function public.save_page_document(uuid, timestamptz, jsonb, jsonb) to authenticated;

-- ─── Tipos de bloco ──────────────────────────────────────────────────────────

-- A DBX-04 (#372, 20261102000400) fixa os tipos em blocks_type_catalog, igual a BLOCK_TYPES. Onde ela já
-- estiver aplicada, entram os blocos das páginas livres; sem ela, não há lista a ampliar.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'blocks_type_catalog' and conrelid = 'public.blocks'::regclass
  ) then
    alter table public.blocks drop constraint blocks_type_catalog;
    alter table public.blocks add constraint blocks_type_catalog check (type in (
      'rich-text', 'list', 'team', 'cta', 'manifesto', 'about',
      'hero', 'media-text', 'image', 'cards', 'gallery', 'faq', 'buttons'
    ));
  end if;
end;
$$;

-- ─── Auditoria ───────────────────────────────────────────────────────────────

alter table public.audit_log drop constraint audit_log_event_check;
alter table public.audit_log add constraint audit_log_event_check check (event in (
  'auth.login.succeeded', 'auth.logout', 'auth.password.changed', 'user.invited', 'user.role_changed',
  'user.activation_changed', 'content.created', 'content.updated', 'content.published', 'content.unpublished',
  'content.archived', 'content.restored', 'content.version_restored', 'content.deleted', 'settings.updated',
  'media.uploaded', 'media.deleted', 'lead.viewed', 'lead.status_changed', 'lead.exported', 'lead.deleted',
  'feedback.viewed', 'feedback.deleted', 'retention.executed', 'access.denied'
));

-- Mesma função de 20261028000100, com o evento novo na lista.
create or replace function public.record_audit_event(
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
declare
  v_role public.app_role;
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão obrigatória para auditoria.' using errcode = '42501';
  end if;

  if p_event is null or p_event not in (
    'auth.login.succeeded', 'auth.logout', 'auth.password.changed',
    'user.invited', 'user.role_changed', 'user.activation_changed',
    'content.created', 'content.updated', 'content.published', 'content.unpublished',
    'content.archived', 'content.restored', 'content.version_restored', 'content.deleted', 'settings.updated',
    'media.uploaded', 'media.deleted', 'lead.viewed', 'lead.status_changed', 'lead.exported',
    'lead.deleted', 'feedback.viewed', 'feedback.deleted', 'retention.executed', 'access.denied'
  ) then
    raise exception 'Evento de auditoria desconhecido.' using errcode = '42501';
  end if;

  v_role := public.current_app_role();

  if p_event like 'content.%' or p_event like 'media.%' then
    if v_role not in ('super_admin', 'admin', 'editor') then
      raise exception 'Seu papel não pode registrar este evento de auditoria.' using errcode = '42501';
    end if;
  elsif p_event like 'lead.%' or p_event like 'feedback.%' or p_event like 'retention.%' then
    if v_role <> 'admin' then
      raise exception 'Seu papel não pode registrar este evento de auditoria.' using errcode = '42501';
    end if;
  elsif p_event like 'settings.%' or p_event like 'user.%' then
    if v_role not in ('super_admin', 'admin') then
      raise exception 'Seu papel não pode registrar este evento de auditoria.' using errcode = '42501';
    end if;
  end if;

  insert into public.audit_log (actor_id, actor_role, event, resource_type, resource_id, outcome, metadata, request_id)
  values ((select auth.uid()), v_role, p_event, p_resource_type, p_resource_id, p_outcome,
          coalesce(p_metadata, '{}'::jsonb), p_request_id);
end;
$$;
