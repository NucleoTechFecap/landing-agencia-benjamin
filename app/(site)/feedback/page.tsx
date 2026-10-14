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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/server/seo";
import { getSiteSettings } from "@/lib/server/content/repository";
import { FeedbackForm } from "@/components/forms/feedback-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { submitFeedback } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: "Feedback",
      description: "Clientes, parceiros, alunos e comunidade: conte para a Agência Benjamin como foi a sua experiência.",
      path: "/feedback",
      keywords: ["feedback Agência Benjamin", "avaliação"],
    },
    await getSiteSettings(),
  );
}

/** Canal de feedback (PRJ §14 / FORM-05). */
export default function FeedbackPage() {
  return (
    <>
      <PageHero
        eyebrow="Feedback"
        title="Como foi com a Benjamin?"
        description={<p>Elogio, crítica ou sugestão: tudo ajuda a agência a melhorar. Você pode responder sem se identificar.</p>}
        path="/feedback"
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Feedback" }]}
        tone="rosa"
        icon="like"
        iconColor="verde"
      />
      <Section tone="nyanza" labelledBy="feedback-form-titulo">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8">
          <h2 id="feedback-form-titulo" className="sr-only">
            Formulário de feedback
          </h2>
          <FeedbackForm action={submitFeedback} />
        </div>
      </Section>
    </>
  );
}
