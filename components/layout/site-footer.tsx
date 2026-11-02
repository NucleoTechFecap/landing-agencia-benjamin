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
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 26/10/2026 Vinícius Nishimura Reis  Logotipo horizontal em SVG (UX-14).
 01/11/2026 Vinícius Nishimura Reis  Endereço sem mapa e redes vazias no rodapé (LAY-03).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import Link from "next/link";
import { MAIN_NAVIGATION, SECONDARY_NAVIGATION } from "@/lib/config/navigation";
import type { SiteSettings } from "@/lib/domain/content/types";
import { Container } from "../ui/container";
import { SocialLinks } from "./social-links";

/** Rodapé com contato, redes sociais, navegação e créditos (LAY-03). */
export function SiteFooter({ settings, year }: { settings: SiteSettings; year: number }) {
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
          <Image
            src="/brand/logos/logo-horizontal.svg"
            alt="Agência Benjamin"
            width={180}
            height={117}
            className="h-auto w-44"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-90">{settings.description}</p>
          <p className="mt-4 text-sm font-bold tracking-widest uppercase">{settings.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase">Navegue</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
            {[...MAIN_NAVIGATION, ...SECONDARY_NAVIGATION].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase">Contato</h2>
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
            <Link href="/contato" className="inline-block font-bold underline underline-offset-4">
              Envie uma mensagem
            </Link>
          </address>
          <SocialLinks socials={settings.socials} className="mt-6" />
        </div>
      </div>
      <Container className="relative flex flex-col gap-2 border-t border-benja-nyanza/25 py-6 text-xs opacity-90 sm:flex-row sm:justify-between">
        <p>© {year} Agência Benjamin · Agência experimental da FECAP.</p>
        <p>
          Plataforma desenvolvida pelo{" "}
          <a
            href="https://www.instagram.com/nucleotechfecap"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-4"
          >
            NúcleoTech FECAP
          </a>
          .
        </p>
      </Container>
    </footer>
  );
}
