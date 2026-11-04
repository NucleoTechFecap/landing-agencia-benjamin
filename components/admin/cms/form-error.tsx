/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : form-error.tsx
 Descrição    : Faixa de erro dos formulários do CMS com pendências de publicação e impacto.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { Notice } from "../ui/primitives";

/** Erro da Server Action: mensagem, listas (o que falta publicar / o que quebraria) e código. */
export function CmsFormError({ state }: { state: CmsFormState }) {
  if (state.status !== "error") return null;
  const lists = [...(state.fieldErrors?.publicacao ?? []), ...(state.fieldErrors?.impacto ?? [])];
  const hasFieldErrors = Object.keys(state.fieldErrors ?? {}).some((key) => key !== "publicacao" && key !== "impacto");
  return (
    <Notice tone="erro" role="alert">
      <p className="font-bold">{hasFieldErrors && !lists.length ? "Revise os campos destacados." : state.message}</p>
      {lists.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {lists.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs opacity-80">Código de atendimento: {state.requestId}</p>
    </Notice>
  );
}
