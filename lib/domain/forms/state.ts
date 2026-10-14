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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
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
