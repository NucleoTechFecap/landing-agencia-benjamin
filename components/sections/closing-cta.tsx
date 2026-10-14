/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : closing-cta.tsx
 Descrição    : Faixa final de conversão com CTAs configuráveis.

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

import { ButtonLink } from "../ui/button-link";
import { Section } from "../ui/section";
import { Sticker } from "../ui/sticker";

export interface ClosingLink {
  id: string;
  label: string;
  href: string;
  external: boolean;
}

/** Faixa final de conversão (contato/projeto) usada na Home e páginas internas. */
export function ClosingCta({
  title = "Tem um projeto em mente?",
  description = "Conte o que você precisa. A equipe da Benjamin responde pelo e-mail informado.",
  links,
}: {
  title?: string;
  description?: string;
  links: ClosingLink[];
}) {
  return (
    <Section tone="laranja" halftone labelledBy="cta-final-titulo">
      <Sticker name="benja" color="verde" width={150} className="absolute top-6 right-6 hidden rotate-6 md:block" />
      <div className="max-w-2xl">
        <h2 id="cta-final-titulo" className="text-balance text-4xl font-black sm:text-5xl">
          {title}
        </h2>
        <p className="mt-4 text-lg">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {links.map((link, index) => (
            <ButtonLink key={link.id} href={link.href} external={link.external} variant={index === 0 ? "primary" : "secondary"}>
              {link.label}
            </ButtonLink>
          ))}
        </div>
      </div>
    </Section>
  );
}
