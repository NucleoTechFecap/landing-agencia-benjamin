/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : profile.ts
 Descrição    : Dados mínimos de perfis administrativos.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Perfis de usuários (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
import type { Role } from "@/lib/domain/auth/rbac";
export interface ManagedProfile {
  id: string;
  full_name: string | null;
  role: Role;
  active: boolean;
  created_at: string;
  updated_at: string;
}
