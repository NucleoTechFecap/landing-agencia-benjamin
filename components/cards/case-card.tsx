/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : case-card.tsx
 Descrição    : Card de case com capa, categoria, cliente e resumo.

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
 01/11/2026 Vinícius Nishimura Reis  Foco visível no card e testes do portfólio (CASE-01).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/lib/domain/content/types";
import { Badge } from "../ui/badge";

export interface CaseCardData extends CaseStudy {
  categoryName: string;
}

/**
 * Card de case com capa, cliente, categoria e resumo. O link cobre o card inteiro, então o
 * contorno de foco do teclado fica no card, que é a área clicável.
 */
export function CaseCard({
  item,
  headingLevel = "h3",
  priority = false,
  ctaLabel,
}: {
  item: CaseCardData;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
  /** Chamada do cartão, editável em Menu, rodapé e textos gerais. */
  ctaLabel: string;
}) {
  const Heading = headingLevel;
  return (
    <article
      data-card
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-benja-noite bg-benja-nyanza text-benja-noite shadow-sticker has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-benja-azul motion-off:transition motion-off:hover:-translate-y-1 motion-off:hover:shadow-sticker-lg"
    >
      {item.cover ? (
        <div data-card-media className="relative aspect-[16/10] overflow-hidden border-b-2 border-benja-noite">
          <Image
            src={item.cover.src}
            alt={item.cover.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover motion-off:transition motion-off:duration-500 motion-off:group-hover:scale-105"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          {item.categoryName ? <Badge>{item.categoryName}</Badge> : null}
        </div>
        <p className="mt-4 text-xs font-bold tracking-widest text-benja-grafite/80 uppercase">{item.client}</p>
        <Heading className="mt-1 text-xl font-black text-benja-verde">
          <Link href={`/cases/${item.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {item.title}
          </Link>
        </Heading>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-benja-grafite">{item.summary}</p>
        <span aria-hidden className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-benja-verde">
          {ctaLabel}{" "}
          <span data-card-arrow className="motion-off:transition motion-off:group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </article>
  );
}
