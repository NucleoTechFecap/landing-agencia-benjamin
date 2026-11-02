/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000200_cms_gravacao_atomica.down.sql
 Descrição    : Reversão das funções de gravação atômica do CMS (TECH-13).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #314).
──────────────────────────────────────────────────────────────────────────────
*/

-- Reverte 20261102000200_cms_gravacao_atomica.sql. O Supabase CLI não executa reversões: aplicar
-- manualmente (SQL Editor ou psql) e registrar no histórico:
--   npx supabase migration repair --status reverted 20261102000200
--
-- Não apaga dados: só as funções. Reverter o código ANTES: a versão atual do painel chama estas
-- funções para salvar serviços e cases. Pode rodar de novo sem erro.

begin;

drop function if exists public.save_case(uuid, timestamptz, jsonb, uuid[], uuid[]);
drop function if exists public.save_service(uuid, timestamptz, jsonb, uuid[]);

commit;
