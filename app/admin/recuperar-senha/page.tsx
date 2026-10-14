/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Tela de solicitação de redefinição de senha.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { ResetRequestForm } from "@/components/admin/auth-forms";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPasswordPage() {
  return (
    <AuthCard title="Recuperar senha" subtitle="Enviaremos um link para o e-mail cadastrado.">
      <ResetRequestForm action={requestPasswordReset} />
    </AuthCard>
  );
}
