/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : formatting.ts
 Descrição    : Formatação segura de títulos e links no corpo dos artigos.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Formatação editorial (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
export type ArticleInline = { text: string; href?: string };

/** Converte somente links HTTPS explícitos; o restante é texto, nunca HTML. */
export function articleInline(text: string): ArticleInline[] {
  const pattern = /\[([^\]\n]{1,120})\]\((https:\/\/[^\s()]+)\)/g;
  const result: ArticleInline[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    if (index > cursor) result.push({ text: text.slice(cursor, index) });
    try {
      const url = new URL(match[2]);
      result.push(
        url.protocol === "https:" && !url.username && !url.password
          ? { text: match[1], href: url.href }
          : { text: match[0] },
      );
    } catch {
      result.push({ text: match[0] });
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) result.push({ text: text.slice(cursor) });
  return result;
}

export function articleLine(line: string): { kind: "heading" | "paragraph"; content: ArticleInline[] } {
  const heading = line.startsWith("## ") && line.slice(3).trim().length > 0;
  return { kind: heading ? "heading" : "paragraph", content: articleInline(heading ? line.slice(3).trim() : line) };
}
