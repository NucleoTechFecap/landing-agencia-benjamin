/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : services-summary.ts
 Descrição    : Frase da Home que resume os serviços publicados.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial: resumo coerente com a quantidade publicada (HOME-07).
──────────────────────────────────────────────────────────────────────────────
*/

const SHOWN = 4;
const list = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

/**
 * Frase de "O que entregamos" na Home. Sai dos serviços publicados, então precisa continuar correta
 * quando o painel muda a quantidade: "e mais" só quando há mais, e singular para um serviço.
 */
export function servicesSummary(names: readonly string[]): string {
  if (!names.length) return "Nossos serviços estão sendo atualizados.";
  const count = names.length === 1 ? "1 serviço" : `${names.length} serviços`;
  return names.length > SHOWN
    ? `${count} — ${names.slice(0, SHOWN).join(", ")} e mais.`
    : `${count} — ${list.format(names)}.`;
}
