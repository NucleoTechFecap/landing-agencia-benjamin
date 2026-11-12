-- ════════════════════════════════════════════════════════════════════════════════
--  Sistema      : Agência Benjamin Landing Page
--  Módulo       : Supabase
--  Arquivo      : 20261112000100_blog.sql
--  Descrição    : Artigos do blog com estados de publicação e RLS.
--  Desenvolvedor: Vinícius Nishimura Reis
--  Projeto      : Agência Benjamin Landing Page
--  Versão       : 1.0.0
--  Criado em    : 12/11/2026
--  Modificado em: 12/11/2026
--  Histórico    : 12/11/2026 Codex — Artigos editoriais (FUT-10).
-- ════════════════════════════════════════════════════════════════════════════════

create table public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.is_valid_slug(slug)),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  summary text check (char_length(summary) <= 280),
  author text check (char_length(author) <= 120),
  topic text check (char_length(topic) <= 80),
  cover_media_id uuid references public.media_assets(id) on delete restrict,
  paragraphs text[] not null default '{}',
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint blog_article_published_at check (status <> 'published' or published_at is not null),
  constraint blog_article_archived_at check ((status = 'archived') = (archived_at is not null)),
  constraint blog_article_paragraph_count check (cardinality(paragraphs) <= 100),
  constraint blog_article_publish_fields check (status <> 'published' or (
    coalesce(char_length(btrim(summary)), 0) between 30 and 280 and
    coalesce(char_length(btrim(author)), 0) between 2 and 120 and
    cardinality(paragraphs) > 0
  ))
);

create index blog_articles_public_idx on public.blog_articles (published_at desc, id) where status = 'published';

create function public.blog_article_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from unnest(new.paragraphs) p where p is null or char_length(btrim(p)) not between 1 and 4000) then
    raise exception 'Parágrafos inválidos.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if current_setting('role', true) = 'authenticated' and new.status is distinct from old.status then
      if (new.status = 'published' or (old.status = 'published' and new.status = 'draft'))
         and not public.has_permission('page', 'publish') then
        raise exception 'Permissão de publicação necessária.' using errcode = '42501';
      end if;
      if (new.status = 'archived' or old.status = 'archived')
         and not public.has_permission('page', 'archive') then
        raise exception 'Permissão de arquivamento necessária.' using errcode = '42501';
      end if;
    end if;
    if old.published_at is null and new.published_at is not null and new.status <> 'published' then
      raise exception 'Data da primeira publicação só pode ser atribuída ao publicar.' using errcode = 'BJ001';
    end if;
    if old.published_at is not null and new.slug <> old.slug then
      raise exception 'O endereço de um artigo publicado não pode mudar.' using errcode = 'BJ001';
    end if;
  end if;
  if new.cover_media_id is not null then
    perform 1 from public.media_assets m where m.id = new.cover_media_id
      and m.mime_type like 'image/%'
      and (new.status <> 'published' or (not m.decorative and coalesce(btrim(m.alt_text), '') <> ''))
      for share;
    if not found then
      raise exception 'A capa publicada precisa ser imagem com texto alternativo.' using errcode = 'BJ003';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.blog_article_guard() from public, anon, authenticated;

create trigger blog_articles_guard before insert or update on public.blog_articles
  for each row execute function public.blog_article_guard();
create trigger blog_articles_state_guard before update on public.blog_articles
  for each row execute function public.enforce_publication_state();
create trigger blog_articles_touch before update on public.blog_articles
  for each row execute function public.touch_updated_at();
create trigger blog_articles_stamp before insert or update on public.blog_articles
  for each row execute function public.stamp_updated_by();

create function public.blog_media_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.mime_type not like 'image/%' or new.decorative or coalesce(btrim(new.alt_text), '') = '')
     and exists (select 1 from public.blog_articles a where a.cover_media_id = new.id and a.status = 'published') then
    raise exception 'Capa de artigo publicado precisa de texto alternativo.' using errcode = 'BJ003';
  end if;
  return new;
end;
$$;
revoke all on function public.blog_media_guard() from public, anon, authenticated;
create trigger blog_media_guard before update on public.media_assets
  for each row execute function public.blog_media_guard();

alter table public.blog_articles enable row level security;
revoke all on public.blog_articles from anon, authenticated;
grant select on public.blog_articles to anon, authenticated;
grant insert, update, delete on public.blog_articles to authenticated;

create policy "blog: público lê publicados" on public.blog_articles for select to anon, authenticated
  using (status = 'published' and published_at <= now());
create policy "media_assets: público lê capas do blog" on public.media_assets for select to anon, authenticated
  using (exists (select 1 from public.blog_articles a where a.cover_media_id = media_assets.id
    and a.status = 'published' and a.published_at <= now()));
create policy "blog: painel lê" on public.blog_articles for select to authenticated
  using (public.has_permission('page', 'view'));
create policy "blog: cria rascunho" on public.blog_articles for insert to authenticated
  with check (public.has_permission('page', 'create') and status = 'draft' and published_at is null and archived_at is null);
create policy "blog: edita" on public.blog_articles for update to authenticated
  using (public.has_permission('page', 'edit'))
  with check (public.has_permission('page', 'edit')
    and (status <> 'published' or public.has_permission('page', 'publish'))
    and (status <> 'archived' or public.has_permission('page', 'archive')));
-- Artigos que já tiveram URL pública permanecem arquivados, preservando a reserva do slug.
create policy "blog: exclui rascunhos arquivados" on public.blog_articles for delete to authenticated
  using (public.has_permission('page', 'delete') and status = 'archived' and published_at is null);
