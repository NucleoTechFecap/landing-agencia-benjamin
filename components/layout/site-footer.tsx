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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
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
      <div aria-hidden className="halftone pointer-events-none absolute inset-0 opacity-40" />
      <Container className="relative grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Image
            src="/brand/logo-horizontal.webp"
            alt="Agência Benjamin"
            width={180}
            height={115}
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
            {settings.contact.address ? (
              <a
                href={settings.contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block underline-offset-4 hover:underline"
              >
                {settings.contact.address}
                <span className="sr-only"> (abre o mapa em nova aba)</span>
              </a>
            ) : null}
            <Link href="/contato" className="inline-block font-bold underline underline-offset-4">
              Envie uma mensagem
            </Link>
          </address>
          <SocialLinks socials={settings.socials} className="mt-6" />
        </div>
      </Container>
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
