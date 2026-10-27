/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Tela de login do painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 26/10/2026 Vinícius Nishimura Reis  Formulário único no shell; next por promessa (B-08) (ADM-02).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/auth-forms";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  link: "O link usado é inválido ou expirou. Solicite um novo.",
  sessao: "Sua sessão expirou. Entre novamente.",
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  // Um único formulário, no shell estático: só os avisos e o destino de retorno dependem da URL.
  const next = searchParams.then((params) => (typeof params.next === "string" ? params.next : undefined));
  return (
    <AuthCard title="Painel da Benjamin" subtitle="Acesso restrito à equipe autorizada.">
      <Suspense fallback={null}>
        <LoginNotices searchParams={searchParams} />
      </Suspense>
      <LoginForm action={signIn} next={next} />
    </AuthCard>
  );
}

async function LoginNotices({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const params = await searchParams;
  const notice = typeof params.erro === "string" ? NOTICES[params.erro] : undefined;
  return (
    <>
      {params.saiu ? (
        <p role="status" className="mb-4 rounded-xl bg-[#e3f9da] px-4 py-3 text-sm font-medium text-[#004a1b]">
          Você saiu do painel com segurança.
        </p>
      ) : null}
      {notice ? (
        <p role="alert" className="mb-4 rounded-xl bg-[#ffe1d1] px-4 py-3 text-sm font-medium text-[#8a2c00]">
          {notice}
        </p>
      ) : null}
    </>
  );
}
