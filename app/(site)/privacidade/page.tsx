/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Minuta do aviso de privacidade dos formulários (pendente de validação).

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
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { PrivacidadeView } from "@/app/(site)/_views/privacidade-view";
import { PRIVACIDADE } from "@/lib/domain/content/catalog/privacidade";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("privacidade")]);
  return buildMetadata(
    {
      title: PRIVACIDADE.seo.title,
      description: PRIVACIDADE.seo.description,
      path: "/privacidade",
      keywords: [...PRIVACIDADE.seo.keywords],
      seo: page?.seo,
    },
    settings,
  );
}

/** Aviso de privacidade (MINUTA técnica: ver PrivacidadeView). */
export default async function PrivacyPage() {
  return <PrivacidadeView page={await getPage("privacidade")} />;
}
