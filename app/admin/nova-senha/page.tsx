/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Tela para definir senha (convite e recuperação).

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
import { NewPasswordForm } from "@/components/admin/auth-forms";
import { updatePassword } from "../actions";

export const metadata: Metadata = { title: "Nova senha" };

/** Usada pelos links de convite (INT-08) e de recuperação: a pessoa define a própria senha. */
export default function NewPasswordPage() {
  return (
    <AuthCard title="Defina sua senha" subtitle="Ninguém da equipe conhece ou recebe a sua senha.">
      <NewPasswordForm action={updatePassword} />
    </AuthCard>
  );
}
