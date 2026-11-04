/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : contact-cta.tsx
 Descrição    : Chamadas de contato do cabeçalho e do rodapé, fora da própria página de contato.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (INT-06).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LinkValue } from "@/lib/domain/content/fields";
import { ButtonLink } from "../ui/button-link";

/**
 * Botão de contato do cabeçalho. Em /contato ele apontaria para a página em que a pessoa já está (INT-06). Fica
 * no DOM, escondido: a entrada do cabeçalho roda uma vez por carregamento, e um item montado depois, ao navegar
 * para outra página, ficaria invisível. O wrapper controla a visibilidade porque o ButtonLink já aplica
 * inline-flex, que venceria o hidden (LAY-02).
 */
export function HeaderContactCta({ link }: { link: LinkValue }) {
  const onContactPage = usePathname() === link.href;
  return (
    <div data-motion="chrome" className={onContactPage ? "hidden" : "hidden sm:block"}>
      <ButtonLink href={link.href} variant="primary" className="px-5 py-2 text-sm">
        {link.label}
      </ButtonLink>
    </div>
  );
}

/** Chamada do bloco de contato do rodapé, com a mesma regra. O rodapé anima como grupo, então pode sair do DOM. */
export function FooterContactLink({ link }: { link: LinkValue }) {
  if (usePathname() === link.href) return null;
  return (
    <Link href={link.href} className="inline-block font-bold underline underline-offset-4">
      {link.label}
    </Link>
  );
}
