/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : browser-validation.ts
 Descrição    : Validação no navegador, antes do POST, com o esquema do servidor.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { parseSubmission, type SubmissionKind } from "./schemas";
import { BROWSER_REQUEST_ID, echoValues, type FormActionState } from "./state";

/** Campos que o visitante não vê: erro neles não é dele, e quem decide é o servidor. */
const TECHNICAL_FIELDS = new Set(["submissionId", "website", "startedAt", "sourcePath"]);

/**
 * Orienta o visitante antes do POST, com o mesmo esquema do servidor, que segue sendo a regra efetiva
 * (FORM-04). Devolve `null` quando o envio deve seguir. Honeypot preenchido também segue, mesmo com outros
 * campos inválidos: o servidor responde em silêncio, e o navegador não pode dar pista diferente ao robô.
 */
export function browserValidationError(kind: SubmissionKind, raw: Record<string, unknown>): FormActionState | null {
  const parsed = parseSubmission(kind, raw);
  if (parsed.success || parsed.fieldErrors.website) return null;
  const fieldErrors = Object.fromEntries(
    Object.entries(parsed.fieldErrors).filter(([field]) => !TECHNICAL_FIELDS.has(field)),
  );
  if (Object.keys(fieldErrors).length === 0) return null;
  return {
    status: "error",
    code: "VALIDATION_FAILED",
    message: "Revise os campos destacados.",
    requestId: BROWSER_REQUEST_ID,
    fieldErrors,
    values: echoValues(raw),
  };
}
