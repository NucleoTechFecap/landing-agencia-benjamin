/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página do canal de feedback.

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
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { FeedbackView } from "@/app/(site)/_views/feedback-view";
import { FEEDBACK } from "@/lib/domain/content/catalog/feedback";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("feedback")]);
  return buildMetadata(
    {
      title: FEEDBACK.seo.title,
      description: FEEDBACK.seo.description,
      path: "/feedback",
      keywords: [...FEEDBACK.seo.keywords],
      seo: page?.seo,
    },
    settings,
  );
}

/** Canal de feedback (PRJ §14 / FORM-05). */
export default async function FeedbackPage() {
  return <FeedbackView page={await getPage("feedback")} />;
}
