/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : page-tabs.tsx
 Descrição    : Abas da edição de uma página: dados e blocos, textos, SEO e histórico.

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

import Link from "next/link";

export interface PageTab {
  id: string;
  label: string;
  href: string;
}

/** Navegação comum: cada aba é um endereço, então o voltar do navegador e os links continuam valendo. */
export function PageTabs({ tabs, current }: { tabs: readonly PageTab[]; current: string }) {
  return (
    <nav aria-label="Partes da página" className="mb-6">
      <ul className="flex flex-wrap gap-1 border-b border-studio-linha">
        {tabs.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={`-mb-px block border-b-2 px-4 py-3 text-sm font-bold ${
                  active
                    ? "border-benja-verde text-benja-verde"
                    : "border-transparent text-studio-suave hover:text-benja-verde"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
