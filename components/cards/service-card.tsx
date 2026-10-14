/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : service-card.tsx
 Descrição    : Card de serviço com ícone, resumo e link para o detalhe.

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

import Link from "next/link";
import type { Service } from "@/lib/domain/content/types";
import { BrandIcon, type BrandIconColor } from "../ui/brand-icon";

const ICON_COLORS: BrandIconColor[] = ["lima", "laranja", "azul", "rosa", "verde-claro", "verde"];

/** Card de serviço usado na Home, em /servicos e no detalhe de área. */
export function ServiceCard({ service, index = 0, headingLevel = "h3" }: { service: Service; index?: number; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-6 text-benja-noite shadow-sticker transition hover:-translate-y-1 hover:shadow-sticker-lg">
      <BrandIcon name={service.icon ?? "estrela"} color={ICON_COLORS[index % ICON_COLORS.length]} size={64} />
      <Heading className="mt-4 text-xl font-black text-benja-verde">
        <Link href={`/servicos/${service.slug}`} className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none">
          {service.name}
        </Link>
      </Heading>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-benja-grafite">{service.summary}</p>
      <span aria-hidden className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-benja-verde">
        Saiba mais <span className="transition group-hover:translate-x-1">→</span>
      </span>
    </article>
  );
}
