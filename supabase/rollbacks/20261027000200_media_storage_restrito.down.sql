/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261027000200_media_storage_restrito.down.sql
 Descrição    : Reversão da restrição do bucket de mídia e do EXECUTE das funções administrativas.

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

-- Reverte 20261027000200_media_storage_restrito.sql. O Supabase CLI não executa reversões:
-- aplicar manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261027000200
--
-- Efeito: o bucket volta a poder ser listado com a chave anon (expõe arquivos de rascunho).
drop policy "media: quem enviou apaga arquivo sem registro" on storage.objects;
drop policy "media: painel lista arquivos" on storage.objects;

create policy "media: leitura pública"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

grant execute on function public.record_audit_event(text, text, text, text, jsonb, text) to public;
grant execute on function public.assign_role(uuid, public.app_role) to public;
grant execute on function public.set_profile_active(uuid, boolean) to public;
