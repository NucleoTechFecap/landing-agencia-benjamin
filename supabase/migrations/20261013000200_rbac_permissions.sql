/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000200_rbac_permissions.sql
 Descrição    : Matriz RBAC no banco, has_permission(), atribuição de papéis e políticas do bucket de mídia.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

-- Matriz RBAC no banco (TECH-03 / ADM-03): espelho exato de lib/domain/auth/rbac.ts.
-- O teste lib/server/auth/rbac-sql.test.ts falha se o seed abaixo divergir do código.
-- Regenerar com: node scripts/print-rbac-seed.mjs

create table public.role_permissions (
  role public.app_role not null,
  resource text not null,
  action text not null check (action in ('view','create','edit','publish','archive','delete','export','manage')),
  primary key (role, resource, action)
);

comment on table public.role_permissions is 'Permissões por papel. Tudo que não estiver aqui é negado (deny by default).';

alter table public.role_permissions enable row level security;
revoke all on public.role_permissions from anon, authenticated;

insert into public.role_permissions (role, resource, action) values
  ('super_admin', 'dashboard', 'view'),
  ('super_admin', 'page', 'view'),
  ('super_admin', 'page', 'create'),
  ('super_admin', 'page', 'edit'),
  ('super_admin', 'page', 'publish'),
  ('super_admin', 'page', 'archive'),
  ('super_admin', 'page', 'delete'),
  ('super_admin', 'area', 'view'),
  ('super_admin', 'area', 'create'),
  ('super_admin', 'area', 'edit'),
  ('super_admin', 'area', 'publish'),
  ('super_admin', 'area', 'archive'),
  ('super_admin', 'area', 'delete'),
  ('super_admin', 'service', 'view'),
  ('super_admin', 'service', 'create'),
  ('super_admin', 'service', 'edit'),
  ('super_admin', 'service', 'publish'),
  ('super_admin', 'service', 'archive'),
  ('super_admin', 'service', 'delete'),
  ('super_admin', 'category', 'view'),
  ('super_admin', 'category', 'create'),
  ('super_admin', 'category', 'edit'),
  ('super_admin', 'category', 'publish'),
  ('super_admin', 'category', 'archive'),
  ('super_admin', 'category', 'delete'),
  ('super_admin', 'case', 'view'),
  ('super_admin', 'case', 'create'),
  ('super_admin', 'case', 'edit'),
  ('super_admin', 'case', 'publish'),
  ('super_admin', 'case', 'archive'),
  ('super_admin', 'case', 'delete'),
  ('super_admin', 'cta', 'view'),
  ('super_admin', 'cta', 'create'),
  ('super_admin', 'cta', 'edit'),
  ('super_admin', 'cta', 'publish'),
  ('super_admin', 'cta', 'archive'),
  ('super_admin', 'cta', 'delete'),
  ('super_admin', 'media', 'view'),
  ('super_admin', 'media', 'create'),
  ('super_admin', 'media', 'edit'),
  ('super_admin', 'media', 'delete'),
  ('super_admin', 'settings', 'view'),
  ('super_admin', 'settings', 'edit'),
  ('super_admin', 'user', 'view'),
  ('super_admin', 'user', 'create'),
  ('super_admin', 'user', 'edit'),
  ('super_admin', 'user', 'manage'),
  ('super_admin', 'audit', 'view'),
  ('admin', 'dashboard', 'view'),
  ('admin', 'page', 'view'),
  ('admin', 'page', 'create'),
  ('admin', 'page', 'edit'),
  ('admin', 'page', 'publish'),
  ('admin', 'page', 'archive'),
  ('admin', 'page', 'delete'),
  ('admin', 'area', 'view'),
  ('admin', 'area', 'create'),
  ('admin', 'area', 'edit'),
  ('admin', 'area', 'publish'),
  ('admin', 'area', 'archive'),
  ('admin', 'area', 'delete'),
  ('admin', 'service', 'view'),
  ('admin', 'service', 'create'),
  ('admin', 'service', 'edit'),
  ('admin', 'service', 'publish'),
  ('admin', 'service', 'archive'),
  ('admin', 'service', 'delete'),
  ('admin', 'category', 'view'),
  ('admin', 'category', 'create'),
  ('admin', 'category', 'edit'),
  ('admin', 'category', 'publish'),
  ('admin', 'category', 'archive'),
  ('admin', 'category', 'delete'),
  ('admin', 'case', 'view'),
  ('admin', 'case', 'create'),
  ('admin', 'case', 'edit'),
  ('admin', 'case', 'publish'),
  ('admin', 'case', 'archive'),
  ('admin', 'case', 'delete'),
  ('admin', 'cta', 'view'),
  ('admin', 'cta', 'create'),
  ('admin', 'cta', 'edit'),
  ('admin', 'cta', 'publish'),
  ('admin', 'cta', 'archive'),
  ('admin', 'cta', 'delete'),
  ('admin', 'media', 'view'),
  ('admin', 'media', 'create'),
  ('admin', 'media', 'edit'),
  ('admin', 'media', 'delete'),
  ('admin', 'settings', 'view'),
  ('admin', 'settings', 'edit'),
  ('admin', 'lead', 'view'),
  ('admin', 'lead', 'edit'),
  ('admin', 'lead', 'archive'),
  ('admin', 'lead', 'delete'),
  ('admin', 'lead', 'export'),
  ('admin', 'feedback', 'view'),
  ('admin', 'feedback', 'edit'),
  ('admin', 'feedback', 'archive'),
  ('admin', 'feedback', 'delete'),
  ('admin', 'user', 'view'),
  ('admin', 'user', 'create'),
  ('admin', 'user', 'edit'),
  ('admin', 'audit', 'view'),
  ('editor', 'dashboard', 'view'),
  ('editor', 'page', 'view'),
  ('editor', 'page', 'create'),
  ('editor', 'page', 'edit'),
  ('editor', 'page', 'publish'),
  ('editor', 'page', 'archive'),
  ('editor', 'area', 'view'),
  ('editor', 'area', 'create'),
  ('editor', 'area', 'edit'),
  ('editor', 'area', 'publish'),
  ('editor', 'area', 'archive'),
  ('editor', 'service', 'view'),
  ('editor', 'service', 'create'),
  ('editor', 'service', 'edit'),
  ('editor', 'service', 'publish'),
  ('editor', 'service', 'archive'),
  ('editor', 'category', 'view'),
  ('editor', 'category', 'create'),
  ('editor', 'category', 'edit'),
  ('editor', 'category', 'publish'),
  ('editor', 'category', 'archive'),
  ('editor', 'case', 'view'),
  ('editor', 'case', 'create'),
  ('editor', 'case', 'edit'),
  ('editor', 'case', 'publish'),
  ('editor', 'case', 'archive'),
  ('editor', 'cta', 'view'),
  ('editor', 'cta', 'create'),
  ('editor', 'cta', 'edit'),
  ('editor', 'cta', 'publish'),
  ('editor', 'cta', 'archive'),
  ('editor', 'media', 'view'),
  ('editor', 'media', 'create'),
  ('editor', 'media', 'edit'),
  ('editor', 'settings', 'view'),
  ('viewer', 'dashboard', 'view'),
  ('viewer', 'page', 'view'),
  ('viewer', 'area', 'view'),
  ('viewer', 'service', 'view'),
  ('viewer', 'category', 'view'),
  ('viewer', 'case', 'view'),
  ('viewer', 'cta', 'view'),
  ('viewer', 'media', 'view'),
  ('viewer', 'settings', 'view');

-- Verifica permissão de quem está logado. Usada nas policies de todas as tabelas do CMS
-- (ex.: using (public.has_permission('case', 'edit'))) e do Storage.
create function public.has_permission(p_resource text, p_action text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_permissions rp
    where rp.role = public.current_app_role()
      and rp.resource = p_resource
      and rp.action = p_action
  );
$$;

revoke execute on function public.has_permission(text, text) from anon;

-- Perfis: quem gerencia usuários lê todos; alterações só pelas funções abaixo.
create policy "profiles: gestores leem todos"
  on public.profiles for select to authenticated
  using (public.has_permission('user', 'view'));

-- Atribuição de papel com as regras de canAssignRole() (ADM-01 §4):
-- ninguém altera o próprio papel; admin só gerencia editor, viewer e pending.
create function public.assign_role(p_target uuid, p_role public.app_role)
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

-- Ativa/desativa conta (desligamento no mesmo dia — GO-09), mesmas regras de alcance.
create function public.set_profile_active(p_target uuid, p_active boolean)
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

revoke execute on function public.assign_role(uuid, public.app_role) from anon;
revoke execute on function public.set_profile_active(uuid, boolean) from anon;

-- Storage: bucket público "media" (ARC-10). Leitura pública; escrita conforme RBAC.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "media: leitura pública"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

create policy "media: upload por quem pode criar mídia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_permission('media', 'create'));

create policy "media: substituição por quem pode editar mídia"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_permission('media', 'edit'));

create policy "media: exclusão por quem pode excluir mídia"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_permission('media', 'delete'));
