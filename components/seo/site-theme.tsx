/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : site-theme.tsx
 Descrição    : Aplica a aparência escolhida no painel às páginas públicas.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { themeCss, type SiteTheme } from "@/lib/domain/content/theme";

/**
 * Cores e fontes do tema (editor do site). Sem nada diferente da marca, não gera nem a tag. O CSS sai
 * de `themeCss`, que só escreve hexadecimal validado e nomes de fonte conhecidos: nada digitado no
 * painel chega aqui como texto livre.
 */
export function SiteThemeStyle({ theme }: { theme?: SiteTheme }) {
  const css = themeCss(theme);
  return css ? <style data-site-theme dangerouslySetInnerHTML={{ __html: css }} /> : null;
}
