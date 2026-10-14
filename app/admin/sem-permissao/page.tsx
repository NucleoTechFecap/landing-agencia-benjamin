/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Tela de acesso negado (403) do painel.

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
import Link from "next/link";
import { AuthCard } from "@/components/admin/auth-card";

export const metadata: Metadata = { title: "Sem permissão" };

/** Destino quando o papel não permite abrir a página solicitada (403 amigável). */
export default function ForbiddenPage() {
  return (
    <AuthCard title="Sem permissão" subtitle="Seu papel não permite acessar esta área do painel.">
      <p className="text-sm leading-relaxed">
        Se você precisa deste acesso para o seu trabalho, fale com um administrador da Agência Benjamin.
      </p>
      <Link
        href="/admin"
        className="mt-6 block w-full rounded-full bg-[#004a1b] px-6 py-3 text-center font-bold text-[#f1fcd0]"
      >
        Voltar ao início do painel
      </Link>
    </AuthCard>
  );
}
