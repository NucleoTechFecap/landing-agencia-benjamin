-- ════════════════════════════════════════════════════════════════════════════════
--  Sistema      : Agência Benjamin Landing Page
--  Módulo       : Supabase
--  Arquivo      : 20261112000100_blog.down.sql
--  Descrição    : Reversão protegida da tabela de artigos.
--  Desenvolvedor: Vinícius Nishimura Reis
--  Projeto      : Agência Benjamin Landing Page
--  Versão       : 1.0.0
--  Criado em    : 12/11/2026
--  Modificado em: 12/11/2026
--  Histórico    : 12/11/2026 Codex — Rollback do blog (FUT-10).
-- ════════════════════════════════════════════════════════════════════════════════

do $$ begin
  if exists (select 1 from public.blog_articles) then
    raise exception 'Há artigos no blog. Faça backup e esvazie a tabela somente após autorização.';
  end if;
end $$;
drop policy "media_assets: público lê capas do blog" on public.media_assets;
drop trigger blog_media_guard on public.media_assets;
drop function public.blog_media_guard();
drop table public.blog_articles;
drop function public.blog_article_guard();
