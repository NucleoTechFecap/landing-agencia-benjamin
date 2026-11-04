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
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonLink } from "../ui/button-link";

const CONTACT_PATH = "/contato";

/**
 * Botão de contato do cabeçalho. Em /contato ele apontaria para a página em que a pessoa já está (INT-06). Fica
 * no DOM, escondido: a entrada do cabeçalho roda uma vez por carregamento, e um item montado depois, ao navegar
 * para outra página, ficaria invisível. O wrapper controla a visibilidade porque o ButtonLink já aplica
 * inline-flex, que venceria o hidden (LAY-02).
 */
export function HeaderContactCta() {
  const onContactPage = usePathname() === CONTACT_PATH;
  return (
    <div data-motion="chrome" className={onContactPage ? "hidden" : "hidden sm:block"}>
      <ButtonLink href={CONTACT_PATH} variant="primary" className="px-5 py-2 text-sm">
        Fale com a gente
      </ButtonLink>
    </div>
  );
}

/** Chamada do bloco de contato do rodapé, com a mesma regra. O rodapé anima como grupo, então pode sair do DOM. */
export function FooterContactLink() {
  if (usePathname() === CONTACT_PATH) return null;
  return (
    <Link href={CONTACT_PATH} className="inline-block font-bold underline underline-offset-4">
      Envie uma mensagem
    </Link>
  );
}
