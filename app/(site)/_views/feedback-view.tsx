/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : feedback-view.tsx
 Descrição    : Conteúdo do canal de feedback, usado pela rota e pela prévia do painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { submitFeedback } from "@/app/(site)/actions";
import { FeedbackForm } from "@/components/forms/feedback-form";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { pageFields } from "@/lib/domain/content/catalog";
import type { Page } from "@/lib/domain/content/types";
import { getPage } from "@/lib/server/content/repository";

/** Canal de feedback (PRJ §14 / FORM-05). */
export async function FeedbackView({ page }: { page: Page | null }) {
  const [geralPage, formulariosPage] = await Promise.all([getPage("site-geral"), getPage("site-formularios")]);
  const { abertura } = pageFields("feedback", page);
  const geral = pageFields("site-geral", geralPage);
  const formularios = pageFields("site-formularios", formulariosPage);

  return (
    <>
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={abertura.descricao ? <p>{abertura.descricao}</p> : undefined}
        path="/feedback"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
        icon={abertura.icone.name}
        iconColor={abertura.icone.color}
      />
      <Section tone="nyanza" labelledBy="feedback-form-titulo">
        <div
          data-motion="reveal"
          className="mx-auto max-w-3xl rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8"
        >
          <h2 id="feedback-form-titulo" className="sr-only">
            Formulário de feedback
          </h2>
          <FeedbackForm action={submitFeedback} textos={formularios.feedback} comum={formularios.comum} />
        </div>
      </Section>
      <PageBlocks page={page} />
    </>
  );
}
