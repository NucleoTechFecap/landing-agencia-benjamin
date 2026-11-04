/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : contato-view.tsx
 Descrição    : Conteúdo da página de contato, usado pela rota e pela prévia do painel.

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

import Link from "next/link";
import { Suspense } from "react";
import { submitContact, submitLead } from "@/app/(site)/actions";
import { ContactForm } from "@/components/forms/contact-form";
import { LeadForm } from "@/components/forms/lead-form";
import { ContactChannels } from "@/components/sections/contact-channels";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { buttonClasses } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { LoadingState } from "@/components/ui/states";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { isSectionHidden, pageFields, type ResolvedPage } from "@/lib/domain/content/catalog";
import type { CONTATO } from "@/lib/domain/content/catalog/contato";
import type { FORMULARIOS } from "@/lib/domain/content/catalog/formularios";
import type { Page } from "@/lib/domain/content/types";
import { CONTACT_SUBJECTS } from "@/lib/domain/forms/schemas";
import { getPage, getSiteSettings, listServices } from "@/lib/server/content/repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** A prévia do painel renderiza a página sem serviço ou assunto na URL. */
const NO_PARAMS: SearchParams = Promise.resolve({});
type TextosAbas = ResolvedPage<typeof CONTATO>["formulario"];

/** Contato institucional + formulário de prospecção (FORM-02, FORM-03, FORM-04). */
export async function ContatoView({
  page,
  searchParams = NO_PARAMS,
}: {
  page: Page | null;
  searchParams?: SearchParams;
}) {
  const [settings, geralPage, formulariosPage] = await Promise.all([
    getSiteSettings(),
    getPage("site-geral"),
    getPage("site-formularios"),
  ]);
  const campos = pageFields("contato", page);
  const geral = pageFields("site-geral", geralPage);
  const formularios = pageFields("site-formularios", formulariosPage);
  const { abertura } = campos;
  const showChannels = !isSectionHidden(page, "canais");

  return (
    <>
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={abertura.descricao ? <p>{abertura.descricao}</p> : undefined}
        path="/contato"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
        icon={abertura.icone.name}
        iconColor={abertura.icone.color}
      />
      <Section tone="nyanza" labelledBy="formulario-titulo">
        <div className={showChannels ? "grid gap-10 lg:grid-cols-[1fr_1.6fr]" : "mx-auto max-w-3xl"}>
          {showChannels ? (
            <ContactChannels contact={settings.contact} socials={settings.socials} textos={campos.canais} />
          ) : null}
          <div
            id="formulario"
            data-motion="reveal"
            className="scroll-mt-28 rounded-3xl border-2 border-benja-noite bg-white/70 p-6 shadow-sticker-lg sm:p-8"
          >
            <h2 id="formulario-titulo" className="sr-only">
              Formulário de contato
            </h2>
            <Suspense fallback={<ContactFormsFallback textos={campos.formulario} />}>
              <ContactForms searchParams={searchParams} textos={campos.formulario} formularios={formularios} />
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
function ContactFormsFallback({ textos }: { textos: TextosAbas }) {
  return (
    <>
      <LoadingState label={textos.carregando} className="[@media(scripting:none)]:hidden" />
      <noscript>
        <p className="font-bold">{textos.semScript}</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Link href={STANDALONE_FORM_PATHS.lead} className={buttonClasses("primary")}>
              {textos.abaProjeto}
            </Link>
          </li>
          <li>
            <Link href={STANDALONE_FORM_PATHS.contact} className={buttonClasses("secondary")}>
              {textos.abaContato}
            </Link>
          </li>
        </ul>
      </noscript>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function ContactForms({
  searchParams,
  textos,
  formularios,
}: {
  searchParams: SearchParams;
  textos: TextosAbas;
  formularios: ResolvedPage<typeof FORMULARIOS>;
}) {
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
              {textos.abaProjeto}
            </Link>
          </li>
          <li className="flex flex-1">
            <Link
              href="/contato?tipo=contato#formulario"
              aria-current={tipo === "contato" ? "page" : undefined}
              className={tabClass(tipo === "contato")}
              scroll={false}
            >
              {textos.abaContato}
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
          textos={formularios.projeto}
          comum={formularios.comum}
        />
      ) : (
        <ContactForm
          key={assunto ?? "sem-assunto"}
          action={submitContact}
          preselectedSubject={assunto}
          textos={formularios.contato}
          comum={formularios.comum}
        />
      )}
    </>
  );
}
