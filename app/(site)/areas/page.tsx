/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página das seis áreas de atuação com âncoras e serviços relacionados.

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
 25/10/2026 Caio Moraes              Última área sem laranja, distinta do CTA final (SOB-04).
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { AreasView } from "@/app/(site)/_views/areas-view";
import { AREAS } from "@/lib/domain/content/catalog/areas";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("areas")]);
  return buildMetadata(
    {
      title: AREAS.seo.title,
      description: AREAS.seo.description,
      path: "/areas",
      keywords: [...AREAS.seo.keywords],
      seo: page?.seo,
    },
    settings,
  );
}

/** Listagem das seis áreas, cada uma com âncora própria e serviços relacionados (SOB-04…SOB-10). */
export default async function AreasPage() {
  return <AreasView page={await getPage("areas")} />;
}
