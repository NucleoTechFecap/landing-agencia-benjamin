/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : icons.tsx
 Descrição    : Ícones de interface do painel, em traço, sem dependência externa.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactNode } from "react";

/*
 * Ícones de interface do painel. São de traço, para orientar sem competir com os ícones ilustrados do
 * brandbook (public/brand/icons), que continuam nas áreas de marca. Ficam no código, e não em uma
 * biblioteca, porque são poucos e nenhuma dependência nova se justifica para isso.
 */
const PATHS = {
  inicio: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6 10v9h4.5v-5h3v5H18v-9" />
    </>
  ),
  revisao: (
    <>
      <path d="M9 5h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1" />
      <rect x="8" y="3.5" width="6" height="3" rx="1" />
      <path d="m8.5 13 2.2 2.2 4.3-4.4" />
    </>
  ),
  paginas: (
    <>
      <path d="M7 3.5h7l4.5 4.5v12a.5.5 0 0 1-.5.5H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4.5M9.5 12.5h5.5M9.5 16h5.5" />
    </>
  ),
  areas: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="3.5" />
      <rect x="4" y="13" width="7" height="7" rx="3.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  servicos: <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5L10 14l-6.5-2L10 10l2-6.5Z" />,
  cases: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h3.5l2 2.5H18a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <path d="m8.5 16 2.5-2.5 2 2 2.5-2.5" />
    </>
  ),
  categorias: (
    <>
      <path d="M4 5a1 1 0 0 1 1-1h6.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.3-.7V5Z" />
      <circle cx="8.5" cy="8.5" r="1.25" />
    </>
  ),
  chamadas: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h3l9 4.5V4.5L8 9H5a1 1 0 0 0-1 1Z" />
      <path d="m8.5 15 1.5 5h2.5l-1.5-3.8M20 10.5v3" />
    </>
  ),
  contatos: (
    <>
      <path d="M4 13.5 6.5 5.5a1 1 0 0 1 1-.7h9a1 1 0 0 1 1 .7L20 13.5V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.5Z" />
      <path d="M4 13.5h5l1.5 2.5h3L15 13.5h5" />
    </>
  ),
  midia: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  configuracoes: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  sair: (
    <>
      <path d="M14 4.5H7a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h7" />
      <path d="M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  site: (
    <>
      <path d="M13 4.5h6.5V11M19.5 4.5 11 13" />
      <path d="M17.5 14v4.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H10" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  fechar: <path d="m6 6 12 12M18 6 6 18" />,
  recolher: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15M16 9.5 13.5 12l2.5 2.5" />
    </>
  ),
  expandir: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15M13.5 9.5 16 12l-2.5 2.5" />
    </>
  ),
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  mais: <path d="M12 5v14M5 12h14" />,
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  cartoes: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  tabela: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  alerta: (
    <>
      <path d="M12 4.5 2.8 19.5h18.4L12 4.5Z" />
      <path d="M12 10.5v4M12 17.2v.1" />
    </>
  ),
  sucesso: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.7v.1" />
    </>
  ),
  erro: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  editar: <path d="m4.5 19.5 1-4L15.8 5.2a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8.5 18.5l-4 1Z" />,
  estrela: <path d="m12 4 2.4 5 5.6.8-4 3.9.9 5.5L12 16.6l-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 4Z" />,
  envio: (
    <>
      <path d="M12 15.5V5M7.5 9.5 12 5l4.5 4.5" />
      <path d="M4.5 15v3.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V15" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type StudioIconName = keyof typeof PATHS;

/** Sempre decorativo: quem dá nome à ação é o texto do botão ou do link. */
export function StudioIcon({
  name,
  size = 20,
  className = "",
}: {
  name: StudioIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
