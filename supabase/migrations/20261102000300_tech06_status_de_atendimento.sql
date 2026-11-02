/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261102000300_tech06_status_de_atendimento.sql
 Descrição    : O painel altera só o status de atendimento dos envios de formulário.

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
 02/11/2026 Vinícius Nishimura Reis  Limita o update do painel à coluna status (TECH-06).
──────────────────────────────────────────────────────────────────────────────
*/

-- Na matriz RBAC, `lead:edit`/`feedback:edit` significam alterar o status de atendimento, nunca o
-- conteúdo enviado pelo visitante. A migration 0400 dava update na tabela inteira: quem tem a
-- permissão podia reescrever `payload`, `kind` e os campos de notificação direto pela API.
-- `updated_at` continua sendo preenchido pelo trigger, e a gravação do servidor usa service_role.
revoke update on public.form_submissions from authenticated;
grant update (status) on public.form_submissions to authenticated;
