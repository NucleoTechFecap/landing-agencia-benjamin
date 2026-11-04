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
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { pageFields } from "@/lib/domain/content/catalog";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";
import { submitContact } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("site-formularios")]);
  return buildMetadata(
    {
      title: pageFields("site-formularios", page).paginaMensagem.titulo,
      description: "Formulário de contato institucional da Agência Benjamin, para quem navega sem JavaScript.",
      path: STANDALONE_FORM_PATHS.contact,
      noindex: true,
    },
    settings,
  );
}

/**
 * Formulário de contato em página estática: é o destino do envio sem JavaScript ou antes da hidratação,
 * porque em /contato o resultado não chegaria ao HTML (FORM-08, ver `useSubmission`).
 */
export default async function ContactFormPage() {
  const [formulariosPage, geralPage] = await Promise.all([getPage("site-formularios"), getPage("site-geral")]);
  const formularios = pageFields("site-formularios", formulariosPage);
  const geral = pageFields("site-geral", geralPage);
  const campos = formularios.paginaMensagem;
  return (
    <>
      <PageHero
        eyebrow={campos.etiqueta}
        title={campos.titulo}
        description={campos.descricao ? <p>{campos.descricao}</p> : undefined}
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, campos.trilhaContato, { label: campos.trilha }]}
        icon={campos.icone.name}
        iconColor={campos.icone.color}
      />
      <Section tone="nyanza" labelledBy="formulario-titulo">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8">
          <h2 id="formulario-titulo" className="sr-only">
            Formulário de contato
          </h2>
          <ContactForm action={submitContact} textos={formularios.contato} comum={formularios.comum} />
          <p className="mt-6 text-sm">
            {campos.outro}{" "}
            <Link href={campos.outroLink.href} className="font-bold underline underline-offset-4">
              {campos.outroLink.label}
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
