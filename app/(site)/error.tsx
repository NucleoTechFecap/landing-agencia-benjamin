/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : error.tsx
 Descrição    : Tela de erro das páginas públicas com código de atendimento.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";

/** Erro inesperado em páginas públicas: mensagem amigável + código para atendimento (ARC-09). */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Section tone="rosa" containerClassName="flex flex-col items-center text-center">
      <BrandIcon name="xicara" color="verde" size={110} />
      <h1 className="mt-6 text-balance text-4xl font-black">Algo deu errado por aqui.</h1>
      <p className="mt-3 max-w-lg text-lg">Já registramos o problema. Tente de novo em instantes.</p>
      {error.digest ? (
        <p className="mt-2 text-sm">
          Código de atendimento: <code className="font-mono font-bold">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full border-2 border-benja-noite bg-benja-verde px-6 py-3 font-bold text-benja-nyanza shadow-sticker"
        >
          Tentar novamente
        </button>
        <ButtonLink href="/" variant="secondary">
          Ir para o início
        </ButtonLink>
      </div>
    </Section>
  );
}
