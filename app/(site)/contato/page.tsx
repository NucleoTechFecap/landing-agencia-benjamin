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
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/server/seo";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/forms/contact-form";
import { LeadForm } from "@/components/forms/lead-form";
import { ContactChannels } from "@/components/sections/contact-channels";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { buttonClasses } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { LoadingState } from "@/components/ui/states";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { CONTACT_SUBJECTS } from "@/lib/domain/forms/schemas";
import { getPage, getSiteSettings, listServices } from "@/lib/server/content/repository";
import { submitContact, submitLead } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: "Contato",
      description:
        "Peça um projeto ou fale com a Agência Benjamin: formulário de novos projetos e contato institucional.",
      path: "/contato",
      keywords: ["contato Agência Benjamin", "orçamento de comunicação", "contratar agência de comunicação"],
    },
    await getSiteSettings(),
  );
}

/** Contato institucional + formulário de prospecção (FORM-02, FORM-03, FORM-04). */
export default async function ContactPage({ searchParams }: PageProps<"/contato">) {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("contato")]);
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos conversar?"
        description={
          <p>Conte sobre o seu projeto ou mande sua mensagem. A equipe da Benjamin responde pelo e-mail informado.</p>
        }
        path="/contato"
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Contato" }]}
        icon="comentario"
      />
      <Section tone="nyanza" labelledBy="formulario-titulo">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <ContactChannels contact={settings.contact} socials={settings.socials} />
          <div
            id="formulario"
            data-motion="reveal"
            className="scroll-mt-28 rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8"
          >
            <h2 id="formulario-titulo" className="sr-only">
              Formulário de contato
            </h2>
            <Suspense fallback={<ContactFormsFallback />}>
              <ContactForms searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </Section>
      <PageBlocks page={page} />
    </>
  );
}

/**
 * O formulário depende da URL e chega por streaming, trocado no lugar do fallback por um script do React:
 * sem JavaScript essa troca nunca acontece. Quem está nessa situação escolhe a página estática (FORM-08).
 */
function ContactFormsFallback() {
  return (
    <>
      <LoadingState label="Carregando formulário…" className="[@media(scripting:none)]:hidden" />
      <noscript>
        <p className="font-bold">Escolha o que você quer enviar:</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Link href={STANDALONE_FORM_PATHS.lead} className={buttonClasses("primary")}>
              Quero um projeto
            </Link>
          </li>
          <li>
            <Link href={STANDALONE_FORM_PATHS.contact} className={buttonClasses("secondary")}>
              Fale com a gente
            </Link>
          </li>
        </ul>
      </noscript>
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
            <Link
              href="/contato#formulario"
              aria-current={tipo === "projeto" ? "page" : undefined}
              className={tabClass(tipo === "projeto")}
              scroll={false}
            >
              Quero um projeto
            </Link>
          </li>
          <li className="flex flex-1">
            <Link
              href="/contato?tipo=contato#formulario"
              aria-current={tipo === "contato" ? "page" : undefined}
              className={tabClass(tipo === "contato")}
              scroll={false}
            >
              Fale com a gente
            </Link>
          </li>
        </ul>
      </nav>
      {/* A key recria o formulário quando o serviço ou o assunto da URL muda. O Next guarda o estado de páginas já
          visitadas, e sem ela o formulário antigo era reaproveitado sem a pré-seleção (SERV-02). */}
      {tipo === "projeto" ? (
        <LeadForm
          key={servico ?? "sem-servico"}
          action={submitLead}
          services={services.map((service) => ({ value: service.slug, label: service.name }))}
          preselectedService={servico}
        />
      ) : (
        <ContactForm key={assunto ?? "sem-assunto"} action={submitContact} preselectedSubject={assunto} />
      )}
    </>
  );
}
