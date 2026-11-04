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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
28/10/2026 Codex                     Aceita apenas códigos conhecidos de aviso (TECH-13).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { CMS_FLASH, CMS_WARNING, isCmsFlash, isCmsWarning } from "@/lib/domain/content/cms-form";
import { Notice } from "../ui/primitives";

/** Lê ?ok= e ?aviso= deixados pela Server Action ao redirecionar. */
export function FlashMessage({ ok, aviso }: { ok?: string | string[]; aviso?: string | string[] }) {
  const flash = typeof ok === "string" && isCmsFlash(ok) ? CMS_FLASH[ok] : null;
  const warningCodes = typeof aviso === "string" ? [...new Set(aviso.split(",").filter(isCmsWarning))] : [];
  if (!flash && warningCodes.length === 0) return null;
  return (
    <div role="status" className="mb-6 space-y-2">
      {flash ? (
        <Notice tone="sucesso" className="animate-studio-entrada font-semibold">
          {flash}
        </Notice>
      ) : null}
      {warningCodes.map((code) => (
        <Notice key={code} tone="atencao">
          <strong>Atenção:</strong> {CMS_WARNING[code]}
        </Notice>
      ))}
    </div>
  );
}
