/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261028000200_cms_atomic_save.down.sql
 Descrição    : Remove as funções atômicas de gravação do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinícius Nishimura Reis  Remove os RPCs atômicos (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

drop function if exists public.save_case(uuid, timestamptz, jsonb, uuid[], uuid[]);
drop function if exists public.save_service(uuid, timestamptz, jsonb, uuid[]);
drop function if exists public.save_category(uuid, timestamptz, jsonb);
drop function if exists public.save_area(uuid, timestamptz, jsonb);
