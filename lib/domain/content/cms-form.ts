/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cms-form.ts
 Descrição    : Estado dos formulários do painel (Server Actions do CMS) compartilhado com os componentes.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Mensagem de arquivo enviado (ADM-08).
28/10/2026 Codex                     Adiciona catálogo fechado de avisos (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

/** Estado devolvido pelas Server Actions do CMS ao formulário (useActionState). */
export type CmsFormState =
  | { status: "idle" }
  | {
      status: "error";
      code: string;
      message: string;
      requestId: string;
      /** Erros por campo; `publicacao` e `impacto` trazem listas para o painel exibir. */
      fieldErrors?: Record<string, string[]>;
      /** Valores digitados, para repreencher o formulário depois do erro. */
      values?: Record<string, string>;
    };

export const CMS_IDLE: CmsFormState = { status: "idle" };

/** Mensagens exibidas depois do redirecionamento de uma operação concluída (?ok=). */
export const CMS_FLASH = {
  criado: "Rascunho criado. Complete os campos e publique quando estiver pronto.",
  salvo: "Alterações salvas.",
  publicado: "Publicado. O site já mostra a versão nova.",
  despublicado: "Despublicado: voltou para rascunho e saiu do site.",
  arquivado: "Arquivado: saiu do site e da lista principal.",
  restaurado: "Restaurado como rascunho.",
  excluido: "Excluído definitivamente.",
  enviado: "Arquivo enviado para a biblioteca. Ele já pode ser escolhido nos formulários.",
} as const;

export type CmsFlash = keyof typeof CMS_FLASH;

export function isCmsFlash(value: unknown): value is CmsFlash {
  return typeof value === "string" && Object.hasOwn(CMS_FLASH, value);
}

/** Avisos fixos exibidos depois de comandos do CMS; query strings não fornecem texto. */
export const CMS_WARNING = {
  "case-services-hidden": "Os vínculos com cases publicados deixarão de aparecer no site.",
  "ctas-fallback": "CTAs publicados passarão a usar o link de fallback.",
} as const;

export type CmsWarning = keyof typeof CMS_WARNING;

export function isCmsWarning(value: unknown): value is CmsWarning {
  return typeof value === "string" && Object.hasOwn(CMS_WARNING, value);
}
