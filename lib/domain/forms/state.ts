/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : state.ts
 Descrição    : Estado devolvido pelas Server Actions dos formulários públicos.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 04/11/2026 Vinícius Nishimura Reis  Falha de rede, leitura do FormData e valores devolvidos ao formulário (FORM-08).
──────────────────────────────────────────────────────────────────────────────
*/

/** Estado devolvido às Server Actions dos formulários (contrato em TECH-02 §5). */
export type FormActionState =
  | { status: "idle" }
  | { status: "success"; protocol: string; duplicate: boolean }
  | {
      status: "error";
      code: string;
      message: string;
      requestId: string;
      fieldErrors?: Record<string, string[]>;
      values?: Record<string, string>;
    };

export const INITIAL_FORM_STATE: FormActionState = { status: "idle" };

/** `requestId` de erro que nasce no navegador: não passou pelo servidor, então não há log a consultar. */
export const BROWSER_REQUEST_ID = "navegador";

/** Campos do formulário, sem os que o React acrescenta para a Server Action e sem arquivos. */
export function readFormData(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) raw[key] = value;
  });
  return raw;
}

const NOT_ECHOED_FIELDS = new Set(["website", "startedAt", "privacyConsent"]);

/** Valores digitados para repreencher o formulário após erro (funciona sem JavaScript). */
export function echoValues(raw: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(raw).filter(([key, value]) => typeof value === "string" && !NOT_ECHOED_FIELDS.has(key)) as [
      string,
      string,
    ][],
  );
}

/** A action não respondeu: rede fora, resposta perdida ou erro da plataforma antes da aplicação (FORM-08). */
export function networkFailure(raw: Record<string, unknown>): FormActionState {
  return {
    status: "error",
    code: "NETWORK_ERROR",
    message: "Não conseguimos enviar agora. Confira sua conexão e tente de novo: o que você digitou continua aqui.",
    requestId: BROWSER_REQUEST_ID,
    values: echoValues(raw),
  };
}
