/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Aviso para contas autenticadas ainda sem papel liberado.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Acesso pendente" };

/** Conta autenticada sem papel liberado (pending) — RBAC N03. */
export default function PendingAccessPage() {
  return (
    <AuthCard title="Acesso pendente" subtitle="Sua conta existe, mas ainda não tem permissão no painel.">
      <p className="text-sm leading-relaxed">
        Peça para a coordenação da Agência Benjamin liberar seu acesso. Assim que o papel for atribuído, entre
        novamente.
      </p>
      <form action={signOut} className="mt-6">
        <button type="submit" className="w-full rounded-full bg-[#004a1b] px-6 py-3 font-bold text-[#f1fcd0]">
          Sair
        </button>
      </form>
    </AuthCard>
  );
}
