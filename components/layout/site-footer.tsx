/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : site-footer.tsx
 Descrição    : Rodapé com contato, redes sociais, navegação e créditos.

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
 26/10/2026 Vinícius Nishimura Reis  Logotipo horizontal em SVG (UX-14).
 01/11/2026 Vinícius Nishimura Reis  Endereço sem mapa e redes vazias no rodapé (LAY-03).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Crédito avisa da nova aba; sem chamada para a própria página de contato (INT-06).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { GERAL } from "@/lib/domain/content/catalog/geral";
import { fillText, type ImageValue } from "@/lib/domain/content/fields";
import { DEFAULT_LOGOS } from "@/lib/domain/content/theme";
import type { SiteSettings } from "@/lib/domain/content/types";
import { Container } from "../ui/container";
import { SiteImage } from "../ui/site-image";
import { FooterContactLink } from "./contact-cta";
import { SocialLinks } from "./social-links";

/** Rodapé com contato, redes sociais, navegação e créditos (LAY-03). */
export function SiteFooter({
  settings,
  year,
  geral,
  logo,
}: {
  settings: SiteSettings;
  year: number;
  geral: ResolvedPage<typeof GERAL>;
  /** Logotipo escolhido em Aparência; sem ele, o da marca. */
  logo?: ImageValue;
}) {
  const { rodape, cabecalho } = geral;
  const logotipo = logo ?? DEFAULT_LOGOS.logoFooter;
  return (
    <footer className="relative overflow-hidden border-t-2 border-benja-noite bg-benja-verde text-benja-nyanza">
      <div
        aria-hidden
        data-wave
        className="halftone pointer-events-none absolute inset-0 opacity-40 motion-on:bg-none motion-on:opacity-100"
      />
      <div
        data-motion="group"
        className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8"
      >
        <div>
          <SiteImage
            src={logotipo.src}
            alt={logotipo.alt || DEFAULT_LOGOS.logoFooter.alt}
            width={logotipo.width ?? DEFAULT_LOGOS.logoFooter.width}
            height={logotipo.height ?? DEFAULT_LOGOS.logoFooter.height}
            className="h-auto w-44"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-90">{settings.description}</p>
          <p className="mt-4 text-sm font-bold tracking-widest uppercase">{settings.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase">{rodape.navegue}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
            {[...cabecalho.menu, ...cabecalho.menuSecundario].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase">{rodape.contato}</h2>
          <address className="mt-4 space-y-2 text-sm not-italic">
            {settings.contact.email ? (
              <a href={`mailto:${settings.contact.email}`} className="block underline-offset-4 hover:underline">
                {settings.contact.email}
              </a>
            ) : null}
            {settings.contact.phone ? <p>{settings.contact.phone}</p> : null}
            {settings.contact.address && settings.contact.mapsUrl ? (
              <a
                href={settings.contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block underline-offset-4 hover:underline"
              >
                {settings.contact.address}
                <span className="sr-only"> (abre o mapa em nova aba)</span>
              </a>
            ) : settings.contact.address ? (
              <p>{settings.contact.address}</p>
            ) : null}
            <FooterContactLink link={rodape.chamada} />
          </address>
          <SocialLinks socials={settings.socials} className="mt-6" />
        </div>
      </div>
      <Container className="relative flex flex-col gap-2 border-t border-benja-nyanza/25 py-6 text-xs opacity-90 sm:flex-row sm:justify-between">
        <p>{fillText(rodape.direitos, { ano: year })}</p>
        <p>
          {rodape.credito}{" "}
          <a
            href={rodape.creditoLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-4"
          >
            {rodape.creditoLink.label}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          .
        </p>
      </Container>
    </footer>
  );
}
