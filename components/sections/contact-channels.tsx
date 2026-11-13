/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : contact-channels.tsx
 Descrição    : Canais institucionais da página de contato; campo vazio não deixa título nem link sem destino.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { SocialLinks } from "@/components/layout/social-links";
import { BrandIcon } from "@/components/ui/brand-icon";
import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { CONTATO } from "@/lib/domain/content/catalog/contato";
import type { SiteSettings } from "@/lib/domain/content/types";

/** Coluna "Outros canais" de /contato, com o que estiver preenchido no painel (ADM-10). */
export function ContactChannels({
  contact,
  socials,
  textos,
}: Pick<SiteSettings, "contact" | "socials"> & { textos: ResolvedPage<typeof CONTATO>["canais"] }) {
  const { address, mapsUrl, email, phone } = contact;
  return (
    <aside
      aria-label="Outros canais"
      data-motion="reveal"
      className="h-fit space-y-6 rounded-3xl border-2 border-benja-noite bg-benja-claro p-7 shadow-sticker"
    >
      <BrandIcon name={textos.icone.name} color={textos.icone.color} size={64} />
      {address || email || phone ? (
        <div>
          <h2 className="text-xl font-black text-benja-verde">{textos.onde}</h2>
          {address && mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block underline underline-offset-4"
            >
              {address}
              <span className="sr-only"> (abre o mapa em nova aba)</span>
            </a>
          ) : address ? (
            <p className="mt-2">{address}</p>
          ) : null}
          {email ? (
            <a href={`mailto:${email}`} className="mt-2 block font-bold underline underline-offset-4">
              {email}
            </a>
          ) : null}
          {phone ? <p className="mt-2">{phone}</p> : null}
        </div>
      ) : null}
      {Object.values(socials).some(Boolean) ? (
        <div>
          <h2 className="text-xl font-black text-benja-verde">{textos.redes}</h2>
          <SocialLinks socials={socials} className="mt-3 text-benja-verde" />
        </div>
      ) : null}
      <p className="text-sm">
        {textos.feedback}{" "}
        <Link href={textos.feedbackLink.href} className="font-bold underline underline-offset-4">
          {textos.feedbackLink.label}
        </Link>
        .
      </p>
    </aside>
  );
}
