/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : section-heading.tsx
 Descrição    : Cabeçalho de seção com sobretítulo, título e descrição.

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

import type { ReactNode } from "react";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  return (
    <header className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <p className="mb-3 inline-block rounded-full border-2 border-current px-3 py-1 text-xs font-bold tracking-widest uppercase">
          {eyebrow}
        </p>
      ) : null}
      <Heading id={id} className="text-balance text-4xl leading-[1.05] font-black tracking-tight sm:text-5xl">
        {title}
      </Heading>
      {description ? <p className="mt-4 text-lg leading-relaxed opacity-90">{description}</p> : null}
    </header>
  );
}
