/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : flash-message.tsx
 Descrição    : Mensagem de sucesso e avisos depois de uma operação do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { CMS_FLASH, isCmsFlash } from "@/lib/domain/content/cms-form";

/** Lê ?ok= e ?aviso= deixados pela Server Action ao redirecionar. */
export function FlashMessage({ ok, aviso }: { ok?: string | string[]; aviso?: string | string[] }) {
  const flash = typeof ok === "string" && isCmsFlash(ok) ? CMS_FLASH[ok] : null;
  const warning = typeof aviso === "string" ? aviso.slice(0, 400) : null;
  if (!flash && !warning) return null;
  return (
    <div role="status" className="mb-6 space-y-2">
      {flash ? (
        <p className="rounded-2xl border-2 border-benja-verde bg-benja-claro px-4 py-3 text-sm font-semibold text-benja-verde">
          {flash}
        </p>
      ) : null}
      {warning ? (
        <p className="rounded-2xl border-2 border-benja-laranja bg-white px-4 py-3 text-sm text-benja-noite">
          <strong>Atenção:</strong> {warning}
        </p>
      ) : null}
    </div>
  );
}
