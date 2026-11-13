/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000400_dbx04_integridade_publicacao.sql
 Descrição    : Transições, data de publicação, dependências de conteúdo publicado e catálogo de blocos no banco.

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
 02/11/2026 Vinicius Binda             Criação inicial (DBX-04).
──────────────────────────────────────────────────────────────────────────────
*/

-- O painel já valida tudo isto antes de gravar; aqui fica a garantia para quem chama a API direto
-- com a própria sessão. Quem vale para quê:
--   - Todos os papéis: transições (TRANSITIONS, TECH-04), data da primeira publicação e catálogo de
--     blocos. São regras de uma linha só.
--   - Só `authenticated`: editar item arquivado e as regras entre tabelas (R03, R06, R07 e R12).
--     service_role e postgres ficam de fora de propósito: manutenção e preparação de dados gravam
--     em etapas e respondem por manter o conteúdo consistente.
--
-- O papel vem de current_setting('role'), que o PostgREST define na transação. current_user não
-- serve: dentro de função security definer ele é sempre o dono da função.
--
-- Erros que o painel traduz (toCmsError): BJ001 estado não permite a operação, BJ003 conteúdo
-- publicado ficaria sem dependência. R05, R08 e R11 continuam avisos da aplicação (TECH-05), e a
-- exclusão só de arquivados continua na RLS.

-- ─── Regras de uma linha ─────────────────────────────────────────────────────

create function public.enforce_publication_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> old.status
     and old.status::text || '>' || new.status::text <> all (array[
       'draft>published', 'draft>archived', 'published>draft', 'published>archived', 'archived>draft'
     ]) then
    raise exception 'Transição de estado não permitida: % para %.', old.status, new.status using errcode = 'BJ001';
  end if;

  -- Sem esta regra, apagar a data também soltaria a trava de endereço da DB-08.
  if old.published_at is not null and new.published_at is distinct from old.published_at then
    raise exception 'A data da primeira publicação não muda.' using errcode = 'BJ001';
  end if;

  -- Profundidade 1 é gravação direta. Maior que isso é efeito de FK (destino de CTA que vira nulo
  -- ao excluir o item apontado), que precisa passar mesmo em CTA arquivado.
  if old.status = 'archived' and new.status = 'archived'
     and pg_trigger_depth() = 1
     and current_setting('role', true) = 'authenticated' then
    raise exception 'Item arquivado precisa ser restaurado antes de editar.' using errcode = 'BJ001';
  end if;

  return new;
end;
$$;

comment on function public.enforce_publication_state() is
  'Transições de TRANSITIONS, published_at fixo depois da primeira publicação e item arquivado sem edição pelo painel (DBX-04).';

create trigger areas_publication_state before update on public.areas
  for each row execute function public.enforce_publication_state();
create trigger services_publication_state before update on public.services
  for each row execute function public.enforce_publication_state();
create trigger case_categories_publication_state before update on public.case_categories
  for each row execute function public.enforce_publication_state();
create trigger cases_publication_state before update on public.cases
  for each row execute function public.enforce_publication_state();
create trigger ctas_publication_state before update on public.ctas
  for each row execute function public.enforce_publication_state();
create trigger pages_publication_state before update on public.pages
  for each row execute function public.enforce_publication_state();

-- Mesma lista de BLOCK_TYPES (conferido em content-sql.test.ts). Tipo novo no código pede migration.
alter table public.blocks add constraint blocks_type_catalog
  check (type in ('rich-text', 'list', 'team', 'cta', 'manifesto', 'about'));

-- ─── Regras entre tabelas: o que o conteúdo publicado precisa ter ────────────

-- Decorativa dispensa alt (dicionário de dados) e PDF não tem alt.
create function public.assert_media_described(p_media_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.media_assets m where m.id = any (p_media_ids) for share;
  if exists (
    select 1 from public.media_assets m
    where m.id = any (p_media_ids)
      and m.mime_type like 'image/%'
      and not m.decorative
      and coalesce(btrim(m.alt_text), '') = ''
  ) then
    raise exception 'Imagem de conteúdo publicado precisa de texto alternativo (R12).' using errcode = 'BJ003';
  end if;
end;
$$;

-- As travas `for share` cobrem a corrida entre duas pessoas: publicar um item enquanto outra
-- despublica o que ele usa. Quem chega depois espera o outro terminar e vê o estado já gravado.
create function public.assert_service_publishable(p_service_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_status public.publish_status;
  v_image uuid;
begin
  select s.status, s.image_media_id into v_status, v_image
  from public.services s where s.id = p_service_id for share;
  if not found or v_status <> 'published' then
    return;
  end if;

  perform 1 from public.service_areas sa where sa.service_id = p_service_id limit 1;
  if not found then
    raise exception 'Serviço publicado precisa de ao menos uma área (R03).' using errcode = 'BJ003';
  end if;

  perform public.assert_media_described(array[v_image]);
end;
$$;

create function public.assert_case_publishable(p_case_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_status public.publish_status;
  v_category uuid;
  v_cover uuid;
begin
  select c.status, c.category_id, c.cover_media_id into v_status, v_category, v_cover
  from public.cases c where c.id = p_case_id for share;
  if not found or v_status <> 'published' then
    return;
  end if;

  perform 1 from public.case_categories cc where cc.id = v_category and cc.status = 'published' for share;
  if not found then
    raise exception 'Case publicado precisa de categoria publicada (R06).' using errcode = 'BJ003';
  end if;

  perform 1 from public.case_services cs
  join public.services s on s.id = cs.service_id
  where cs.case_id = p_case_id and s.status = 'published'
  limit 1
  for share of s;
  if not found then
    raise exception 'Case publicado precisa de ao menos um serviço publicado (R07).' using errcode = 'BJ003';
  end if;

  perform public.assert_media_described(
    array_append(array(select cm.media_id from public.case_media cm where cm.case_id = p_case_id), v_cover)
  );
end;
$$;

-- Security definer: a verificação precisa ver o conteúdo inteiro, seja qual for a RLS de quem chama.
create function public.enforce_publication_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if current_setting('role', true) is distinct from 'authenticated' then
    return null;
  end if;

  case tg_table_name
    when 'services' then
      perform public.assert_service_publishable(new.id);
      if new.status <> 'published' then
        for v_id in
          select cs.case_id from public.case_services cs
          join public.cases c on c.id = cs.case_id
          where cs.service_id = new.id and c.status = 'published'
        loop
          perform public.assert_case_publishable(v_id);
        end loop;
      end if;
    when 'service_areas' then
      perform public.assert_service_publishable(old.service_id);
    when 'cases' then
      perform public.assert_case_publishable(new.id);
    when 'case_categories' then
      for v_id in
        select c.id from public.cases c where c.category_id = new.id and c.status = 'published'
      loop
        perform public.assert_case_publishable(v_id);
      end loop;
    when 'case_services' then
      perform public.assert_case_publishable(old.case_id);
    when 'case_media' then
      perform public.assert_case_publishable(new.case_id);
    when 'media_assets' then
      if exists (select 1 from public.services s where s.image_media_id = new.id and s.status = 'published')
         or exists (select 1 from public.cases c where c.cover_media_id = new.id and c.status = 'published')
         or exists (
           select 1 from public.case_media cm join public.cases c on c.id = cm.case_id
           where cm.media_id = new.id and c.status = 'published'
         ) then
        perform public.assert_media_described(array[new.id]);
      end if;
  end case;
  return null;
end;
$$;

comment on function public.enforce_publication_integrity() is
  'R03, R06, R07 e R12 para quem grava como authenticated, verificados no fim da transação (DBX-04).';

-- Adiados para o fim da transação: save_service e save_case apagam e recriam os vínculos no meio
-- dela. O when é avaliado na hora da gravação e evita enfileirar o que não afeta conteúdo publicado.
create constraint trigger services_publication_integrity after update on public.services
  deferrable initially deferred for each row
  when (new.status = 'published' or old.status = 'published')
  execute function public.enforce_publication_integrity();
create constraint trigger service_areas_publication_integrity after delete on public.service_areas
  deferrable initially deferred for each row
  execute function public.enforce_publication_integrity();
create constraint trigger cases_publication_integrity after update on public.cases
  deferrable initially deferred for each row
  when (new.status = 'published')
  execute function public.enforce_publication_integrity();
create constraint trigger case_categories_publication_integrity after update on public.case_categories
  deferrable initially deferred for each row
  when (old.status = 'published' and new.status <> 'published')
  execute function public.enforce_publication_integrity();
create constraint trigger case_services_publication_integrity after delete on public.case_services
  deferrable initially deferred for each row
  execute function public.enforce_publication_integrity();
create constraint trigger case_media_publication_integrity after insert or update on public.case_media
  deferrable initially deferred for each row
  execute function public.enforce_publication_integrity();
create constraint trigger media_assets_publication_integrity after update on public.media_assets
  deferrable initially deferred for each row
  when (old.alt_text is distinct from new.alt_text
        or old.decorative is distinct from new.decorative
        or old.mime_type is distinct from new.mime_type)
  execute function public.enforce_publication_integrity();

-- Só os triggers usam estas funções: nada aqui fica disponível pela API.
revoke execute on function public.enforce_publication_state() from public, anon, authenticated, service_role;
revoke execute on function public.enforce_publication_integrity() from public, anon, authenticated, service_role;
revoke execute on function public.assert_media_described(uuid[]) from public, anon, authenticated, service_role;
revoke execute on function public.assert_service_publishable(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.assert_case_publishable(uuid) from public, anon, authenticated, service_role;

comment on table public.services is 'Serviços oferecidos. Pertencem a 1..N áreas (R03: no banco para o painel, DBX-04).';
