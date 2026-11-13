/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página de contato com abas de novo projeto e contato institucional.

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
 25/10/2026 Caio Moraes              Serviço pré-selecionado também após navegar (SERV-02).
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Sem JavaScript o fallback leva às páginas estáticas dos formulários (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Canais vêm de ContactChannels: endereço sem mapa não vira link vazio (ADM-10).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { ContatoView } from "@/app/(site)/_views/contato-view";
import { CONTATO } from "@/lib/domain/content/catalog/contato";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("contato")]);
  return buildMetadata(
    {
      title: CONTATO.seo.title,
      description: CONTATO.seo.description,
      path: "/contato",
      keywords: [...CONTATO.seo.keywords],
      seo: page?.seo,
    },
    settings,
  );
}

/** Contato institucional + formulário de prospecção (FORM-02, FORM-03, FORM-04). */
export default async function ContactPage({ searchParams }: PageProps<"/contato">) {
  return <ContatoView page={await getPage("contato")} searchParams={searchParams} />;
}
