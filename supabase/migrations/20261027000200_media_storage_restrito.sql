/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261027000200_media_storage_restrito.sql
 Descrição    : Bucket de mídia sem listagem anônima, limpeza de envio órfão e funções administrativas sem EXECUTE público.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 27/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 27/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

-- Achados da revisão TECH-13 sobre o Storage e as funções administrativas.

-- 1. Listagem do bucket "media" só para o painel.
-- A política antiga dava SELECT em storage.objects a anon: com a chave anon (pública) dava para
-- listar o bucket inteiro, inclusive capas e galerias de cases em rascunho, e baixar cada uma
-- pela URL pública. O bucket continua público: a URL /object/public/media/<caminho> não passa
-- por RLS, então o site segue exibindo as imagens publicadas. Só a listagem deixa de ser aberta.
drop policy "media: leitura pública" on storage.objects;

create policy "media: painel lista arquivos"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.has_permission('media', 'view'));

-- 2. Quem enviou pode apagar o próprio arquivo enquanto ele não estiver registrado na biblioteca.
-- Se o registro em media_assets falha depois do envio, o serviço de mídia tenta apagar o arquivo,
-- mas o editor não tem media:delete e o arquivo ficava órfão no bucket. Arquivo já registrado
-- continua exigindo media:delete.
create policy "media: quem enviou apaga arquivo sem registro"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and owner_id = (select auth.uid())::text
    and not exists (select 1 from public.media_assets m where m.path = storage.objects.name)
  );

-- 3. Funções administrativas sem EXECUTE para PUBLIC.
-- O "revoke … from anon" das migrations anteriores não tinha efeito, porque anon herda o EXECUTE
-- de PUBLIC. As funções já recusam chamada sem sessão; isto só fecha a porta no nível de permissão.
-- has_permission e current_app_role ficam como estão: as políticas de RLS avaliadas para anon
-- dependem delas.
revoke execute on function public.record_audit_event(text, text, text, text, jsonb, text) from public;
revoke execute on function public.assign_role(uuid, public.app_role) from public;
revoke execute on function public.set_profile_active(uuid, boolean) from public;
