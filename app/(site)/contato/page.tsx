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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/forms/contact-form";
import { LeadForm } from "@/components/forms/lead-form";
import { SocialLinks } from "@/components/layout/social-links";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Section } from "@/components/ui/section";
import { CONTACT_SUBJECTS } from "@/lib/domain/forms/schemas";
import { getSiteSettings, listServices } from "@/lib/server/content/repository";
import { submitContact, submitLead } from "../actions";

export const metadata: Metadata = {
  title: "Contato",
  description: "Peça um projeto ou fale com a Agência Benjamin: formulário de novos projetos e contato institucional.",
};

/** Contato institucional + formulário de prospecção (FORM-02, FORM-03, FORM-04). */
export default async function ContactPage({ searchParams }: PageProps<"/contato">) {
  const settings = await getSiteSettings();
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos conversar?"
        description={<p>Conte sobre o seu projeto ou mande sua mensagem. A equipe da Benjamin responde pelo e-mail informado.</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Contato" }]}
        icon="comentario"
      />
      <Section tone="nyanza" labelledBy="formulario-titulo">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <aside aria-label="Outros canais" className="h-fit space-y-6 rounded-3xl border-2 border-benja-noite bg-benja-claro p-7 shadow-sticker">
            <BrandIcon name="enviado" color="verde" size={64} />
            <div>
              <h2 className="text-xl font-black text-benja-verde">Onde estamos</h2>
              {settings.contact.address ? (
                <a href={settings.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block underline underline-offset-4">
                  {settings.contact.address}
                  <span className="sr-only"> (abre o mapa em nova aba)</span>
                </a>
              ) : null}
              {settings.contact.email ? (
                <a href={`mailto:${settings.contact.email}`} className="mt-2 block font-bold underline underline-offset-4">
                  {settings.contact.email}
                </a>
              ) : null}
            </div>
            <div>
              <h2 className="text-xl font-black text-benja-verde">Redes sociais</h2>
              <SocialLinks socials={settings.socials} className="mt-3 text-benja-verde" />
            </div>
            <p className="text-sm">
              É cliente, parceiro ou aluno e quer contar como foi?{" "}
              <Link href="/feedback" className="font-bold underline underline-offset-4">
                Deixe seu feedback
              </Link>
              .
            </p>
          </aside>
          <div id="formulario" className="scroll-mt-28 rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8">
            <h2 id="formulario-titulo" className="sr-only">
              Formulário de contato
            </h2>
            <Suspense fallback={<p className="font-bold">Carregando formulário…</p>}>
              <ContactForms searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </Section>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function ContactForms({ searchParams }: Pick<PageProps<"/contato">, "searchParams">) {
  const [params, services] = await Promise.all([searchParams, listServices()]);
  const tipo = first(params.tipo) === "contato" || first(params.assunto) ? "contato" : "projeto";
  const servico = services.find((service) => service.slug === first(params.servico))?.slug;
  const assunto = Object.keys(CONTACT_SUBJECTS).find((key) => key === first(params.assunto));
  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2.5 text-center text-sm font-bold transition ${active ? "bg-benja-verde text-benja-nyanza" : "hover:bg-benja-claro"}`;

  return (
    <>
      <nav aria-label="Tipo de mensagem" className="mb-8">
        <ul className="flex gap-2 rounded-full border-2 border-benja-noite bg-benja-nyanza p-1.5">
          <li className="flex flex-1">
            <Link href="/contato#formulario" aria-current={tipo === "projeto" ? "page" : undefined} className={tabClass(tipo === "projeto")} scroll={false}>
              Quero um projeto
            </Link>
          </li>
          <li className="flex flex-1">
            <Link href="/contato?tipo=contato#formulario" aria-current={tipo === "contato" ? "page" : undefined} className={tabClass(tipo === "contato")} scroll={false}>
              Fale com a gente
            </Link>
          </li>
        </ul>
      </nav>
      {tipo === "projeto" ? (
        <LeadForm action={submitLead} services={services.map((service) => ({ value: service.slug, label: service.name }))} preselectedService={servico} />
      ) : (
        <ContactForm action={submitContact} preselectedSubject={assunto} />
      )}
    </>
  );
}
