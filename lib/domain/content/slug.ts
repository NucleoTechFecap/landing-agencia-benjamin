/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : slug.ts
 Descrição    : Geração e validação de slugs (formato, tamanho, reservados e unicidade).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-05).
──────────────────────────────────────────────────────────────────────────────
*/

/** Formato aceito: minúsculas, números e hífens simples (kebab-case). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 80;

/** Segmentos que conflitam com rotas ou ações e não podem ser usados como slug. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "novo",
  "nova",
  "editar",
  "new",
  "edit",
  "preview",
  "rascunho",
  "todos",
  "filtro",
  "pagina",
]);

/** Converte um título em slug: remove acentos, pontuação e espaços repetidos. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export type SlugProblem = "format" | "length" | "reserved";

/** Retorna o problema do slug ou `null` quando ele é válido. */
export function validateSlug(slug: string): SlugProblem | null {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) return "length";
  if (!SLUG_PATTERN.test(slug)) return "format";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}

export function isValidSlug(slug: string): boolean {
  return validateSlug(slug) === null;
}

/** Gera um slug único acrescentando sufixo numérico (ex.: "social-media-2"). */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || "item";
  if (!used.has(root) && !RESERVED_SLUGS.has(root)) return root;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${root.slice(0, SLUG_MAX_LENGTH - String(suffix).length - 1)}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}
