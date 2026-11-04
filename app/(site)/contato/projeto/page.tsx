/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Formulário de novo projeto em página estática, para o envio sem JavaScript.

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
import { LeadForm } from "@/components/forms/lead-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { getSiteSettings, listServices } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";
import { submitLead } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: "Quero um projeto",
      description: "Formulário de novos projetos da Agência Benjamin, para quem navega sem JavaScript.",
      path: STANDALONE_FORM_PATHS.lead,
      noindex: true,
    },
    await getSiteSettings(),
  );
}

/**
 * Formulário de novo projeto em página estática: é o destino do envio sem JavaScript ou antes da
 * hidratação, porque em /contato o resultado não chegaria ao HTML (FORM-08, ver `useSubmission`).
 */
export default async function LeadFormPage() {
  const services = await listServices();
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Quero um projeto"
        description={<p>Conte sobre o seu projeto. A equipe da Benjamin responde pelo e-mail informado.</p>}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Contato", href: "/contato" },
          { label: "Novo projeto" },
        ]}
        icon="comentario"
      />
      <Section tone="nyanza" labelledBy="formulario-titulo">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8">
          <h2 id="formulario-titulo" className="sr-only">
            Formulário de novo projeto
          </h2>
          <LeadForm
            action={submitLead}
            services={services.map((service) => ({ value: service.slug, label: service.name }))}
          />
          <p className="mt-6 text-sm">
            Quer falar de outro assunto?{" "}
            <Link href={STANDALONE_FORM_PATHS.contact} className="font-bold underline underline-offset-4">
              Fale com a gente
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
