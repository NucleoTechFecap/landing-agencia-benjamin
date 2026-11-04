/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Formulário de contato em página estática, para o envio sem JavaScript.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";
import { submitContact } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: "Fale com a gente",
      description: "Formulário de contato institucional da Agência Benjamin, para quem navega sem JavaScript.",
      path: STANDALONE_FORM_PATHS.contact,
      noindex: true,
    },
    await getSiteSettings(),
  );
}

/**
 * Formulário de contato em página estática: é o destino do envio sem JavaScript ou antes da hidratação,
 * porque em /contato o resultado não chegaria ao HTML (FORM-08, ver `useSubmission`).
 */
export default function ContactFormPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale com a gente"
        description={<p>Mande sua mensagem. A equipe da Benjamin responde pelo e-mail informado.</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Contato", href: "/contato" }, { label: "Mensagem" }]}
        icon="comentario"
      />
      <Section tone="nyanza" labelledBy="formulario-titulo">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8">
          <h2 id="formulario-titulo" className="sr-only">
            Formulário de contato
          </h2>
          <ContactForm action={submitContact} />
          <p className="mt-6 text-sm">
            Quer pedir um projeto?{" "}
            <Link href={STANDALONE_FORM_PATHS.lead} className="font-bold underline underline-offset-4">
              Vá ao formulário de novo projeto
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
