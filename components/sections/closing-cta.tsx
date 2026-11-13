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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Sem link publicado, a faixa não aparece (HOME-07).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { isExternalHref, type LinkValue } from "@/lib/domain/content/fields";
import { ButtonLink } from "../ui/button-link";
import { Section } from "../ui/section";
import { Sticker } from "../ui/sticker";

export interface ClosingLink {
  id: string;
  label: string;
  href: string;
  external: boolean;
}

/** Botões da faixa vindos dos campos da página: o que sai do site abre em nova aba. */
export const closingLinks = (...links: readonly LinkValue[]): ClosingLink[] =>
  links.map((link, index) => ({
    id: String(index),
    label: link.label,
    href: link.href,
    external: isExternalHref(link.href),
  }));

/** Faixa final de conversão (contato/projeto) usada na Home e páginas internas. */
export function ClosingCta({
  title,
  description,
  sticker,
  links,
}: {
  title: string;
  description: string;
  /** Endereço do sticker escolhido no painel; sem ele, o da marca. */
  sticker?: string;
  links: ClosingLink[];
}) {
  // Sem CTA publicado, o convite ficaria sem ter onde clicar: a faixa inteira sai (HOME-07).
  if (!links.length) return null;
  return (
    <Section tone="laranja" halftone labelledBy="cta-final-titulo" data-clip-reveal>
      <div data-parallax="-36" className="absolute top-6 right-6 hidden md:block">
        <div data-motion="pop" className="rotate-6">
          {sticker ? <Sticker src={sticker} width={150} /> : <Sticker name="benja" color="verde" width={150} />}
        </div>
      </div>
      <div className="max-w-2xl">
        <h2 id="cta-final-titulo" data-motion="lines" className="text-balance text-4xl font-black sm:text-5xl">
          {title}
        </h2>
        <p data-motion="reveal" className="mt-4 text-lg">
          {description}
        </p>
        <div data-motion="group" className="mt-8 flex flex-wrap gap-3">
          {links.map((link, index) => (
            <ButtonLink
              key={link.id}
              href={link.href}
              external={link.external}
              variant={index === 0 ? "primary" : "secondary"}
            >
              {link.label}
            </ButtonLink>
          ))}
        </div>
      </div>
    </Section>
  );
}
