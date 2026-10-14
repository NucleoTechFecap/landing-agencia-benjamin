/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261013000100_auth_profiles.sql
 Descrição    : Papéis, perfis administrativos, trigger de perfil pendente e RLS do próprio perfil.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
──────────────────────────────────────────────────────────────────────────────
*/

-- Perfis administrativos e papéis (ADM-01/ADM-02).
-- Contas são criadas apenas por convite (cadastro público desligado no Supabase Auth);
-- toda conta nova nasce com papel "pending" (sem acesso ao painel).

create type public.app_role as enum ('super_admin', 'admin', 'editor', 'viewer', 'pending');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  role public.app_role not null default 'pending',
  active boolean not null default true,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil e papel de cada conta do painel. Papel nunca é definido pelo cliente.';

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;

-- Cria o perfil "pending" automaticamente para todo usuário convidado.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Papel efetivo de quem está logado. SECURITY DEFINER evita recursão nas policies.
-- Conta inativa ou sem perfil vale como "pending".
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role from public.profiles where id = (select auth.uid()) and active),
    'pending'::public.app_role
  );
$$;

revoke execute on function public.current_app_role() from anon;

-- Cada pessoa lê o próprio perfil. Leitura/alteração de outros perfis entra com a
-- matriz RBAC (ADM-03), via has_permission('user', ...).
create policy "profiles: lê o próprio perfil"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
