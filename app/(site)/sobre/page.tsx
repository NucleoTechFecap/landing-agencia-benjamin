/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página Sobre: agência experimental, proposta, modelo de atuação e áreas.

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
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 01/11/2026 Vinícius Nishimura Reis  Seção Nosso time como bloco opcional (SOB-03).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { SobreView } from "@/app/(site)/_views/sobre-view";
import { SOBRE } from "@/lib/domain/content/catalog/sobre";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("sobre")]);
  return buildMetadata(
    {
      title: SOBRE.seo.title,
      description: SOBRE.seo.description,
      path: "/sobre",
      keywords: [...SOBRE.seo.keywords],
      seo: page?.seo,
    },
    settings,
  );
}

/** Página Sobre: agência experimental, proposta, modelo de atuação e FECAP (PRJ §8 / SOB-01, SOB-02). */
export default async function AboutPage() {
  return <SobreView page={await getPage("sobre")} />;
}
